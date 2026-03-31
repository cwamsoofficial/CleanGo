import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import logo from "@/assets/cleango-logo.png";

const Terms = () => {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <img src={logo} alt="CleanGo Logo" className="h-10 w-10 rounded-full object-contain bg-white p-1 shadow-md ring-1 ring-border transition-transform duration-200 hover:scale-110" />
          </Link>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button variant="ghost" asChild>
              <Link to="/auth">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Login
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 max-w-4xl">
        <h1 className="text-4xl font-bold text-foreground mb-2">Terms of Service</h1>
        <p className="text-muted-foreground mb-8">Last updated: December 3, 2025</p>

        <div className="prose prose-neutral dark:prose-invert max-w-none space-y-8">
          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">1. Acceptance of Terms</h2>
            <p className="text-muted-foreground leading-relaxed">
              By accessing or using CleanGo (&quot;Community Waste Management&quot;), you agree to be bound by these Terms of Service. If you disagree with any part of these terms, you may not access our services.
            </p>
            <p className="text-muted-foreground leading-relaxed mt-4">
              These terms apply to all users of the platform, including citizens, companies, waste collectors, recyclers, and administrators.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">2. Description of Services</h2>
            <p className="text-muted-foreground leading-relaxed">CleanGo provides:</p>
            <ul className="list-disc list-inside text-muted-foreground mt-2 space-y-1">
              <li>Waste pickup scheduling and tracking</li>
              <li>Recycling management and material processing</li>
              <li>Issue reporting and resolution system</li>
              <li>Rewards and incentive programs</li>
              <li>Environmental impact tracking and analytics</li>
              <li>Community engagement and leaderboards</li>
              <li>Digital billing and payment processing</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">3. User Accounts</h2>
            <h3 className="text-lg font-medium text-foreground mb-2">Registration</h3>
            <p className="text-muted-foreground leading-relaxed">
              You must provide accurate, complete, and current information during registration. You are responsible for maintaining the confidentiality of your account credentials.
            </p>
            
            <h3 className="text-lg font-medium text-foreground mb-2 mt-4">Account Types</h3>
            <ul className="list-disc list-inside text-muted-foreground mt-2 space-y-1">
              <li><strong>Citizen:</strong> Individual users requesting waste collection services</li>
              <li><strong>Company:</strong> Organizations with commercial waste management needs</li>
              <li><strong>Collector:</strong> Authorized waste collection service providers</li>
              <li><strong>Recycler:</strong> Certified recycling facility operators</li>
            </ul>

            <h3 className="text-lg font-medium text-foreground mb-2 mt-4">Account Responsibilities</h3>
            <p className="text-muted-foreground leading-relaxed">
              You are responsible for all activities under your account. Notify us immediately of any unauthorized access or security breaches.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">4. Waste Collection Services</h2>
            <h3 className="text-lg font-medium text-foreground mb-2">Scheduling</h3>
            <p className="text-muted-foreground leading-relaxed">
              Users may schedule waste pickups through the platform. Pickup times are estimates and may vary based on collector availability, weather, and other factors.
            </p>

            <h3 className="text-lg font-medium text-foreground mb-2 mt-4">Waste Preparation</h3>
            <p className="text-muted-foreground leading-relaxed">Users agree to:</p>
            <ul className="list-disc list-inside text-muted-foreground mt-2 space-y-1">
              <li>Properly bag and secure all waste materials</li>
              <li>Separate recyclables according to local guidelines</li>
              <li>Not include hazardous materials without proper notification</li>
              <li>Ensure waste is accessible at the designated location</li>
            </ul>

            <h3 className="text-lg font-medium text-foreground mb-2 mt-4">Prohibited Materials</h3>
            <p className="text-muted-foreground leading-relaxed">
              Standard waste collection does not include hazardous waste, medical waste, construction debris, or other regulated materials. Special arrangements must be made for such materials.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">5. Collector Obligations</h2>
            <p className="text-muted-foreground leading-relaxed">Waste collectors using our platform agree to:</p>
            <ul className="list-disc list-inside text-muted-foreground mt-2 space-y-1">
              <li>Maintain all required licenses and permits</li>
              <li>Complete assigned pickups in a timely manner</li>
              <li>Handle waste materials safely and responsibly</li>
              <li>Provide proof of collection when required</li>
              <li>Report issues or problems promptly through the platform</li>
              <li>Dispose of waste at authorized facilities only</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">6. Recycling Services</h2>
            <p className="text-muted-foreground leading-relaxed">
              Recycling services are subject to material acceptance criteria. We reserve the right to reject contaminated or improperly sorted materials. Points and rewards for recycling are based on verified weight and material type.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">7. Rewards Program</h2>
            <h3 className="text-lg font-medium text-foreground mb-2">Earning Points</h3>
            <p className="text-muted-foreground leading-relaxed">
              Points are earned through completed pickups, recycling, referrals, and other platform activities. Point values may change at our discretion with reasonable notice.
            </p>

            <h3 className="text-lg font-medium text-foreground mb-2 mt-4">Redemption</h3>
            <p className="text-muted-foreground leading-relaxed">
              Points may be redeemed for rewards as available in the platform. Rewards are subject to availability and may have expiration dates. Points have no cash value except as specifically provided.
            </p>

            <h3 className="text-lg font-medium text-foreground mb-2 mt-4">Fraud Prevention</h3>
            <p className="text-muted-foreground leading-relaxed">
              Any attempt to manipulate, fraudulently earn, or abuse the rewards system will result in forfeiture of points and potential account termination.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">8. Payments and Billing</h2>
            <p className="text-muted-foreground leading-relaxed">
              Service fees are based on your subscription plan and usage. Payments are due according to your billing cycle. Failure to pay may result in service suspension.
            </p>
            <p className="text-muted-foreground leading-relaxed mt-4">
              Refunds are available only as specified in our refund policy or required by law.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">9. User Conduct</h2>
            <p className="text-muted-foreground leading-relaxed">You agree not to:</p>
            <ul className="list-disc list-inside text-muted-foreground mt-2 space-y-1">
              <li>Violate any applicable laws or regulations</li>
              <li>Provide false or misleading information</li>
              <li>Interfere with platform operations or security</li>
              <li>Harass, abuse, or harm other users</li>
              <li>Use the platform for unauthorized commercial purposes</li>
              <li>Attempt to access accounts or data belonging to others</li>
              <li>Upload malicious code or content</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">10. Issue Reporting</h2>
            <p className="text-muted-foreground leading-relaxed">
              Users may report service issues, missed pickups, or environmental concerns through our platform. Reports should be accurate, timely, and include relevant evidence when possible. False reports may result in account penalties.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">11. Intellectual Property</h2>
            <p className="text-muted-foreground leading-relaxed">
              All content, features, and functionality of CleanGo are owned by us and protected by intellectual property laws. You may not copy, modify, distribute, or create derivative works without our written permission.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">12. Disclaimer of Warranties</h2>
            <p className="text-muted-foreground leading-relaxed">
              Services are provided &quot;as is&quot; and &quot;as available&quot; without warranties of any kind. We do not guarantee uninterrupted or error-free service. We are not responsible for third-party collector or recycler performance.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">13. Limitation of Liability</h2>
            <p className="text-muted-foreground leading-relaxed">
              To the maximum extent permitted by law, CleanGo shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of our services.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">14. Indemnification</h2>
            <p className="text-muted-foreground leading-relaxed">
              You agree to indemnify and hold harmless CleanGo and its affiliates from any claims, damages, or expenses arising from your use of the platform or violation of these terms.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">15. Account Termination</h2>
            <p className="text-muted-foreground leading-relaxed">
              We may suspend or terminate accounts for violations of these terms, fraudulent activity, or other conduct harmful to the platform or community. You may close your account at any time through account settings.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">16. Changes to Terms</h2>
            <p className="text-muted-foreground leading-relaxed">
              We reserve the right to modify these terms at any time. Material changes will be communicated via email or platform notification. Continued use after changes constitutes acceptance.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">17. Governing Law</h2>
            <p className="text-muted-foreground leading-relaxed">
              These terms are governed by applicable local laws. Any disputes shall be resolved in the courts of the jurisdiction where CleanGo operates.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">18. Contact Information</h2>
            <p className="text-muted-foreground leading-relaxed">
              For questions about these Terms of Service:
            </p>
            <ul className="list-none text-muted-foreground mt-2 space-y-1">
              <li><strong>Email:</strong> cleango@gmail.com</li>
              <li><strong>Address:</strong> CleanGo Headquarters, Kano State, Nigeria</li>
            </ul>
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

export default Terms;
