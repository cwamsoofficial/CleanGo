import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface ContactRequest {
  name: string;
  email: string;
  subject: string;
  message: string;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      throw new Error("RESEND_API_KEY is not configured");
    }

    const body = await req.json();
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const email = typeof body.email === "string" ? body.email.trim() : "";
    const subject = typeof body.subject === "string" ? body.subject.trim() : "";
    const message = typeof body.message === "string" ? body.message.trim() : "";

    // Validate required fields
    if (!name || !email || !subject || !message) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing required fields" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Validate lengths
    if (name.length > 100) return new Response(JSON.stringify({ success: false, error: "Name too long (max 100)" }), { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } });
    if (email.length > 255) return new Response(JSON.stringify({ success: false, error: "Email too long (max 255)" }), { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } });
    if (subject.length > 200) return new Response(JSON.stringify({ success: false, error: "Subject too long (max 200)" }), { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } });
    if (message.length > 5000) return new Response(JSON.stringify({ success: false, error: "Message too long (max 5000)" }), { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } });

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid email format" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Sanitize for HTML output
    const safeName = escapeHtml(name);
    const safeSubject = escapeHtml(subject);
    const safeMessage = escapeHtml(message);

    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "CleanGo Contact <onboarding@resend.dev>",
        to: ["cleangoofficialkano@gmail.com"],
        subject: `Contact Form: ${safeSubject}`,
        reply_to: email,
        html: `
          <h2>New Contact Form Submission</h2>
          <p><strong>From:</strong> ${safeName} (${escapeHtml(email)})</p>
          <p><strong>Subject:</strong> ${safeSubject}</p>
          <hr />
          <h3>Message:</h3>
          <p>${safeMessage.replace(/\n/g, "<br />")}</p>
          <hr />
          <p style="color: #666; font-size: 12px;">
            This message was sent from the CleanGo contact form.
            You can reply directly to this email to respond to ${safeName}.
          </p>
        `,
      }),
    });

    const data = await emailResponse.json();

    if (!emailResponse.ok) {
      console.error("Resend API error:", data);
      throw new Error("Failed to send email");
    }

    console.log("Contact email sent successfully");

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: unknown) {
    console.error("Error in send-contact-email function:", error);
    return new Response(
      JSON.stringify({ success: false, error: "An error occurred while sending your message" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
