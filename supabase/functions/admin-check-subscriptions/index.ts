import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const PLAN_TIER_MAP: Record<string, string> = {
  "PLN_premium_basic_placeholder": "basic",
  "PLN_premium_pro_placeholder": "pro",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    const paystackKey = Deno.env.get("PAYSTACK_SECRET_KEY");
    if (!paystackKey) throw new Error("PAYSTACK_SECRET_KEY is not set");

    // Verify caller is admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Auth error: ${userError.message}`);

    const { data: roleData } = await supabaseClient
      .from("user_roles")
      .select("role")
      .eq("user_id", userData.user.id)
      .single();

    if (roleData?.role !== "admin") {
      throw new Error("Admin access required");
    }

    // Fetch all active subscriptions from Paystack
    const subscriptionsByEmail: Record<string, { tier: string; end: string }> = {};
    let page = 1;
    let hasMore = true;

    while (hasMore) {
      const res = await fetch(
        `https://api.paystack.co/subscription?perPage=100&page=${page}&status=active`,
        { headers: { Authorization: `Bearer ${paystackKey}` } }
      );
      const data = await res.json();

      if (!data.status || !data.data?.length) {
        hasMore = false;
        break;
      }

      for (const sub of data.data) {
        const email = sub.customer?.email?.toLowerCase();
        if (!email) continue;

        const planCode = sub.plan?.plan_code || "";
        const tier = PLAN_TIER_MAP[planCode] || "basic";

        subscriptionsByEmail[email] = {
          tier,
          end: sub.next_payment_date || "",
        };
      }

      hasMore = data.data.length === 100;
      page++;
    }

    // Get all user emails from auth
    const { data: authUsers } = await supabaseClient.auth.admin.listUsers({ perPage: 1000 });

    // Map user IDs to subscription status
    const userSubscriptions: Record<string, { subscribed: boolean; tier: string | null; end: string | null }> = {};

    for (const user of authUsers?.users || []) {
      const email = user.email?.toLowerCase();
      if (email && subscriptionsByEmail[email]) {
        userSubscriptions[user.id] = {
          subscribed: true,
          tier: subscriptionsByEmail[email].tier,
          end: subscriptionsByEmail[email].end,
        };
      } else {
        userSubscriptions[user.id] = { subscribed: false, tier: null, end: null };
      }
    }

    return new Response(JSON.stringify(userSubscriptions), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
