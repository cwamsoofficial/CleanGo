import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const logStep = (step: string, details?: Record<string, unknown>) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[PAYSTACK-WEBHOOK] ${step}${detailsStr}`);
};

const PLAN_TIER_MAP: Record<string, string> = {
  "PLN_premium_basic_placeholder": "basic",
  "PLN_premium_pro_placeholder": "pro",
};

async function verifyPaystackSignature(body: string, signature: string, secret: string): Promise<boolean> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-512" },
    false,
    ["sign"]
  );
  const signatureBuffer = await crypto.subtle.sign("HMAC", key, encoder.encode(body));
  const hashArray = Array.from(new Uint8Array(signatureBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
  return hashHex === signature;
}

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
    logStep("Webhook received");

    const paystackKey = Deno.env.get("PAYSTACK_SECRET_KEY");
    if (!paystackKey) throw new Error("PAYSTACK_SECRET_KEY is not set");

    // Read the raw body for signature verification
    const rawBody = await req.text();
    const signature = req.headers.get("x-paystack-signature") || "";

    // Verify webhook signature
    const isValid = await verifyPaystackSignature(rawBody, signature, paystackKey);
    if (!isValid) {
      logStep("Invalid signature - rejecting webhook");
      return new Response(JSON.stringify({ error: "Invalid signature" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
    }
    logStep("Signature verified");

    const event = JSON.parse(rawBody);
    const eventType = event.event;
    logStep("Event type", { eventType });

    // Handle relevant events
    switch (eventType) {
      case "subscription.create":
      case "subscription.not_renew":
      case "subscription.enable": {
        const data = event.data;
        const customerEmail = data.customer?.email;
        const planCode = data.plan?.plan_code;
        const status = data.status;
        logStep("Subscription event", { customerEmail, planCode, status });

        if (customerEmail) {
          const tier = (status === "active" || status === "non-renewing")
            ? (PLAN_TIER_MAP[planCode] || "basic")
            : null;

          // Find user by email
          const { data: authUsers } = await supabaseClient.auth.admin.listUsers({ perPage: 1000 });
          const user = authUsers?.users?.find(u => u.email?.toLowerCase() === customerEmail.toLowerCase());

          if (user) {
            const { error: updateError } = await supabaseClient
              .from("profiles")
              .update({ subscription_tier: tier })
              .eq("id", user.id);

            if (updateError) {
              logStep("Failed to update profile", { error: updateError.message });
            } else {
              logStep("Profile subscription tier updated", { userId: user.id, tier });
            }
          } else {
            logStep("No matching user found for email", { customerEmail });
          }
        }
        break;
      }

      case "subscription.disable": {
        const data = event.data;
        const customerEmail = data.customer?.email;
        logStep("Subscription disabled", { customerEmail });

        if (customerEmail) {
          const { data: authUsers } = await supabaseClient.auth.admin.listUsers({ perPage: 1000 });
          const user = authUsers?.users?.find(u => u.email?.toLowerCase() === customerEmail.toLowerCase());

          if (user) {
            await supabaseClient
              .from("profiles")
              .update({ subscription_tier: null })
              .eq("id", user.id);
            logStep("Profile subscription tier cleared", { userId: user.id });
          }
        }
        break;
      }

      case "charge.success": {
        const data = event.data;
        const customerEmail = data.customer?.email;
        logStep("Charge successful", { customerEmail, amount: data.amount, reference: data.reference });
        // One-off payment success - no subscription tier change needed
        // You can add custom logic here (e.g., mark a bill as paid)
        break;
      }

      default:
        logStep("Unhandled event type", { eventType });
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    // Always return 200 to Paystack to prevent retries on our processing errors
    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  }
});
