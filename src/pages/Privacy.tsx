import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import logo from "@/assets/cleango-logo.png";

const Privacy = () => {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <img src={logo} alt="CleanGo Logo" className="h-10 w-10 rounded-full object-contain bg-white p-1 shadow-md ring-1 ring-border" />
          </Link>
          <Button variant="ghost" asChild>
            <Link to="/auth">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Login
            </Link>
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 max-w-4xl">
        <h1 className="text-4xl font-bold text-foreground mb-2">Privacy Policy</h1>
        <p className="text-muted-foreground mb-8">Last updated: December 3, 2025</p>

        <div className="prose prose-neutral dark:prose-invert max-w-none space-y-8">
          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">1. Introduction</h2>
            <p className="text-muted-foreground leading-relaxed">
              CleanGo (&quot;Community Waste Management&quot;, &quot;we&quot;, &quot;our&quot;, or &quot;us&quot;) is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our waste management platform and services.
            </p>
            <p className="text-muted-foreground leading-relaxed mt-4">
              We comply with the General Data Protection Regulation (GDPR) and other applicable data protection laws. By using our services, you agree to the collection and use of information in accordance with this policy.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">2. Information We Collect</h2>
            <h3 className="text-lg font-medium text-foreground mb-2">Personal Information</h3>
            <p className="text-muted-foreground leading-relaxed">We may collect the following personal information:</p>
            <ul className="list-disc list-inside text-muted-foreground mt-2 space-y-1">
              <li>Name and contact information (email address, phone number)</li>
              <li>Physical address for waste collection services</li>
              <li>Account credentials (email and encrypted password)</li>
              <li>Role type (citizen, company, collector, recycler)</li>
              <li>Payment and billing information</li>
              <li>Profile information and preferences</li>
            </ul>

            <h3 className="text-lg font-medium text-foreground mb-2 mt-4">Usage Data</h3>
            <p className="text-muted-foreground leading-relaxed">We automatically collect:</p>
            <ul className="list-disc list-inside text-muted-foreground mt-2 space-y-1">
              <li>Device information and browser type</li>
              <li>IP address and location data</li>
              <li>Service usage patterns and interactions</li>
              <li>Waste pickup history and schedules</li>
              <li>Issue reports and communications</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">3. Legal Basis for Processing (GDPR)</h2>
            <p className="text-muted-foreground leading-relaxed">We process your personal data based on:</p>
            <ul className="list-disc list-inside text-muted-foreground mt-2 space-y-1">
              <li><strong>Contract Performance:</strong> To provide waste management services you requested</li>
              <li><strong>Legitimate Interests:</strong> To improve our services and ensure platform security</li>
              <li><strong>Legal Obligation:</strong> To comply with environmental and waste management regulations</li>
              <li><strong>Consent:</strong> For marketing communications and optional features</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">4. How We Use Your Information</h2>
            <p className="text-muted-foreground leading-relaxed">We use collected information to:</p>
            <ul className="list-disc list-inside text-muted-foreground mt-2 space-y-1">
              <li>Provide and maintain waste collection and recycling services</li>
              <li>Process and schedule waste pickups</li>
              <li>Manage your account and rewards points</li>
              <li>Send service notifications and updates</li>
              <li>Respond to issue reports and support requests</li>
              <li>Improve our platform and develop new features</li>
              <li>Ensure platform security and prevent fraud</li>
              <li>Comply with legal obligations and regulations</li>
              <li>Generate anonymized analytics and environmental impact reports</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">5. Data Sharing and Disclosure</h2>
            <p className="text-muted-foreground leading-relaxed">We may share your information with:</p>
            <ul className="list-disc list-inside text-muted-foreground mt-2 space-y-1">
              <li><strong>Service Providers:</strong> Waste collectors and recycling partners to fulfill services</li>
              <li><strong>Payment Processors:</strong> To process billing and rewards transactions</li>
              <li><strong>Government Authorities:</strong> When required by law or environmental regulations</li>
              <li><strong>Business Partners:</strong> For reward redemption and promotional offers</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-4">
              We do not sell your personal information to third parties.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">6. Your Rights (GDPR)</h2>
            <p className="text-muted-foreground leading-relaxed">Under GDPR, you have the right to:</p>
            <ul className="list-disc list-inside text-muted-foreground mt-2 space-y-1">
              <li><strong>Access:</strong> Request copies of your personal data</li>
              <li><strong>Rectification:</strong> Request correction of inaccurate data</li>
              <li><strong>Erasure:</strong> Request deletion of your personal data</li>
              <li><strong>Restrict Processing:</strong> Request limitation of data processing</li>
              <li><strong>Data Portability:</strong> Request transfer of your data</li>
              <li><strong>Object:</strong> Object to certain types of processing</li>
              <li><strong>Withdraw Consent:</strong> Withdraw consent at any time</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-4">
              To exercise these rights, contact us at cleango@gmail.com or through your account settings.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">7. Data Retention</h2>
            <p className="text-muted-foreground leading-relaxed">
              We retain your personal data only for as long as necessary to fulfill the purposes outlined in this policy, unless a longer retention period is required by law. Waste pickup records may be retained for compliance with environmental regulations.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">8. Data Security</h2>
            <p className="text-muted-foreground leading-relaxed">
              We implement appropriate technical and organizational measures to protect your personal data, including encryption, secure servers, access controls, and regular security assessments. However, no method of transmission over the internet is 100% secure.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">9. International Data Transfers</h2>
            <p className="text-muted-foreground leading-relaxed">
              Your data may be transferred to and processed in countries outside your residence. We ensure appropriate safeguards are in place, including Standard Contractual Clauses approved by the European Commission.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">10. Cookies and Tracking</h2>
            <p className="text-muted-foreground leading-relaxed">
              We use essential cookies to maintain your session and preferences. Analytics cookies help us understand service usage. You can manage cookie preferences through your browser settings.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">11. Children&apos;s Privacy</h2>
            <p className="text-muted-foreground leading-relaxed">
              Our services are not intended for individuals under 16 years of age. We do not knowingly collect personal data from children. If you believe we have collected such data, please contact us immediately.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">12. Changes to This Policy</h2>
            <p className="text-muted-foreground leading-relaxed">
              We may update this Privacy Policy periodically. We will notify you of significant changes via email or platform notification. Continued use after changes constitutes acceptance of the updated policy.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">13. Contact Us</h2>
            <p className="text-muted-foreground leading-relaxed">
              For privacy-related inquiries or to exercise your rights:
            </p>
            <ul className="list-none text-muted-foreground mt-2 space-y-1">
              <li><strong>Email:</strong> cleango@gmail.com</li>
              <li><strong>Address:</strong> CleanGo Headquarters, Kano State, Nigeria</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-4">
              You have the right to lodge a complaint with a supervisory authority if you believe your data protection rights have been violated.
            </p>
          </section>
        </div>
      </main>

      <footer className="border-t mt-12">
        <div className="container mx-auto px-4 py-6 text-center text-muted-foreground text-sm">
          © {new Date().getFullYear()} CleanGo. All rights reserved.
        </div>
      </footer>
    </div>
  );
};

export default Privacy;
