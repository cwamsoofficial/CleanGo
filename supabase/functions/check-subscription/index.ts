import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const logStep = (step: string, details?: Record<string, unknown>) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CHECK-SUBSCRIPTION] ${step}${detailsStr}`);
};

// Map Paystack plan codes to tier names
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
    logStep("Function started");

    const paystackKey = Deno.env.get("PAYSTACK_SECRET_KEY");
    if (!paystackKey) throw new Error("PAYSTACK_SECRET_KEY is not set");
    logStep("Paystack key verified");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");
    logStep("Authorization header found");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    // List subscriptions for this email from Paystack
    const subsRes = await fetch(
      `https://api.paystack.co/subscription?customer=${encodeURIComponent(user.email)}`,
      {
        headers: { Authorization: `Bearer ${paystackKey}` },
      }
    );
    const subsData = await subsRes.json();
    logStep("Paystack subscriptions response", { status: subsData.status });

    let hasActiveSub = false;
    let planCode: string | null = null;
    let subscriptionEnd: string | null = null;

    if (subsData.status && subsData.data) {
      // Find the first active subscription
      const activeSub = subsData.data.find(
        (sub: any) => sub.status === "active" || sub.status === "non-renewing"
      );
      if (activeSub) {
        hasActiveSub = true;
        planCode = activeSub.plan?.plan_code || null;
        subscriptionEnd = activeSub.next_payment_date || null;
        logStep("Active subscription found", { planCode, subscriptionEnd });
      } else {
        logStep("No active subscription found");
      }
    }

    // Determine tier from plan code
    let tier: string | null = null;
    if (hasActiveSub && planCode) {
      tier = PLAN_TIER_MAP[planCode] || "basic"; // Default to basic if unknown plan
    }

    // Sync subscription tier to profiles table
    const { error: updateError } = await supabaseClient
      .from("profiles")
      .update({ subscription_tier: tier })
      .eq("id", user.id);

    if (updateError) {
      logStep("Warning: failed to sync subscription tier", { error: updateError.message });
    } else {
      logStep("Subscription tier synced to profile", { tier });
    }

    return new Response(JSON.stringify({
      subscribed: hasActiveSub,
      plan_code: planCode,
      subscription_end: subscriptionEnd,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in check-subscription", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
