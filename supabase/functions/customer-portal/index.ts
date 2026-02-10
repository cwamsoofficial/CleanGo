import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const logStep = (step: string, details?: Record<string, unknown>) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CUSTOMER-PORTAL] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const paystackKey = Deno.env.get("PAYSTACK_SECRET_KEY");
    if (!paystackKey) throw new Error("PAYSTACK_SECRET_KEY is not set");
    logStep("Paystack key verified");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");
    logStep("Authorization header found");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    // Get the subscription code and token for this user
    const subsRes = await fetch(
      `https://api.paystack.co/subscription?customer=${encodeURIComponent(user.email)}`,
      {
        headers: { Authorization: `Bearer ${paystackKey}` },
      }
    );
    const subsData = await subsRes.json();

    if (!subsData.status || !subsData.data?.length) {
      throw new Error("No active subscription found for this user");
    }

    const activeSub = subsData.data.find(
      (sub: any) => sub.status === "active" || sub.status === "non-renewing"
    );

    if (!activeSub) {
      throw new Error("No active subscription found for this user");
    }

    // Generate a manage subscription link using Paystack's subscription endpoint
    const manageLink = activeSub.email_token
      ? `https://paystack.com/manage/subscriptions?email_token=${activeSub.email_token}`
      : null;

    // If no manage link available, provide subscription details for the frontend to handle
    logStep("Subscription found", {
      subscriptionCode: activeSub.subscription_code,
      status: activeSub.status,
    });

    return new Response(JSON.stringify({
      url: manageLink,
      subscription_code: activeSub.subscription_code,
      status: activeSub.status,
      next_payment_date: activeSub.next_payment_date,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in customer-portal", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
