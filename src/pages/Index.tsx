import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Recycle, Users, TrendingUp, Shield, Clock, Leaf } from "lucide-react";
import logo from "@/assets/cwamso-logo.png";

const Index = () => {
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate("/dashboard");
      }
    });
  }, [navigate]);

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-background to-secondary/5">
        <div className="container mx-auto px-4 py-24">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center justify-center mb-6">
              <img src={logo} alt="CWaMSo Logo" className="h-32 w-auto" />
            </div>
            <h1 className="text-5xl md:text-6xl font-bold text-foreground mb-6 leading-tight">
              Community Waste
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent"> Management</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              Connect citizens, companies, collectors, and administrators for efficient, transparent, and rewarding waste management.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" onClick={() => navigate("/auth")} className="text-lg">
                Get Started
              </Button>
              <Button size="lg" variant="outline" onClick={() => navigate("/auth")} className="text-lg">
                Sign In
              </Button>
            </div>
          </div>
        </div>

        {/* Decorative Elements */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/5 rounded-full blur-3xl"></div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-card">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-foreground mb-4">
              Why Choose CWaMSo?
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              A comprehensive platform designed to revolutionize waste management in your community
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard
              icon={Recycle}
              title="Real-Time Tracking"
              description="Monitor waste collection activities in real-time with instant updates and confirmations"
            />
            <FeatureCard
              icon={Users}
              title="Multi-Role System"
              description="Seamlessly connect citizens, companies, collectors, and administrators in one platform"
            />
            <FeatureCard
              icon={TrendingUp}
              title="Rewards Program"
              description="Earn points for compliance and participation, redeemable for real rewards"
            />
            <FeatureCard
              icon={Shield}
              title="Issue Reporting"
              description="Report and track waste management issues with photo evidence and real-time updates"
            />
            <FeatureCard
              icon={Clock}
              title="Smart Analytics"
              description="Access comprehensive analytics dashboards with insights and performance metrics"
            />
            <FeatureCard
              icon={Leaf}
              title="Eco-Friendly"
              description="Promote sustainability and environmental responsibility in your community"
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-primary to-primary/80">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold text-primary-foreground mb-6">
            Ready to Transform Waste Management?
          </h2>
          <p className="text-xl text-primary-foreground/90 mb-8 max-w-2xl mx-auto">
            Join thousands of communities already benefiting from efficient, transparent waste management
          </p>
          <Button
            size="lg"
            variant="secondary"
            onClick={() => navigate("/auth")}
            className="text-lg"
          >
            Start Your Journey
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-card border-t border-border py-8">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <img src={logo} alt="CWaMSo Logo" className="h-8 w-auto" />
          </div>
          <p className="text-muted-foreground">
            © 2024 CWaMSo. All rights reserved. Building sustainable communities together.
          </p>
        </div>
      </footer>
    </div>
  );
};

interface FeatureCardProps {
  icon: any;
  title: string;
  description: string;
}

const FeatureCard = ({ icon: Icon, title, description }: FeatureCardProps) => {
  return (
    <div className="bg-background p-6 rounded-xl border border-border hover:border-primary/50 transition-all duration-300 hover:shadow-lg">
      <div className="inline-flex items-center justify-center w-12 h-12 bg-primary/10 rounded-xl mb-4">
        <Icon className="w-6 h-6 text-primary" />
      </div>
      <h3 className="text-xl font-semibold text-foreground mb-2">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </div>
  );
};

export default Index;
