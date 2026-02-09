import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
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
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

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

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    // Get all active subscriptions from Stripe
    const subscriptions: Record<string, { tier: string; end: string }> = {};
    let hasMore = true;
    let startingAfter: string | undefined;

    while (hasMore) {
      const params: Stripe.SubscriptionListParams = { status: "active", limit: 100, expand: ["data.customer"] };
      if (startingAfter) params.starting_after = startingAfter;

      const subs = await stripe.subscriptions.list(params);

      for (const sub of subs.data) {
        const customer = sub.customer as Stripe.Customer;
        if (!customer.email) continue;

        const priceId = sub.items.data[0]?.price.id;
        const productId = sub.items.data[0]?.price.product as string;
        const end = new Date(sub.current_period_end * 1000).toISOString();

        subscriptions[customer.email.toLowerCase()] = {
          tier: priceId || productId || "premium",
          end,
        };
      }

      hasMore = subs.has_more;
      if (subs.data.length > 0) {
        startingAfter = subs.data[subs.data.length - 1].id;
      }
    }

    // Get all user emails from auth (admin has service role access)
    const { data: authUsers } = await supabaseClient.auth.admin.listUsers({ perPage: 1000 });

    // Map user IDs to subscription status
    const userSubscriptions: Record<string, { subscribed: boolean; tier: string | null; end: string | null }> = {};

    for (const user of authUsers?.users || []) {
      const email = user.email?.toLowerCase();
      if (email && subscriptions[email]) {
        userSubscriptions[user.id] = {
          subscribed: true,
          tier: subscriptions[email].tier,
          end: subscriptions[email].end,
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
