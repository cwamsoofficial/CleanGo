import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ArrowRight, Recycle, Users, TrendingUp, Shield, Clock, Leaf, UserPlus, CalendarCheck, Truck, Gift, ChevronRight } from "lucide-react";
import logo from "@/assets/cleango-logo.png";
import wasteBinsHero from "@/assets/waste-bins-hero.jpg";


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
    <div className="min-h-screen bg-gradient-to-b from-primary/5 to-background">
      {/* Header */}
      <header className="border-b border-border bg-background/95 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div
              className="flex items-center gap-3 cursor-pointer"
              onClick={() => navigate("/")}
            >
              <img src={logo} alt="CleanGo Logo" className="h-12 w-auto" />
            </div>
            <div className="flex items-center gap-3">
              
              <Button onClick={() => navigate("/auth")} size="lg" className="rounded-full px-8">
                Login
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div className="space-y-8">
              <h1 className="text-5xl md:text-6xl font-bold text-foreground leading-tight">
                Fixing last-mile waste collection in Kano State communities
              </h1>
              <p className="text-xl text-muted-foreground leading-relaxed">
                CleanGo connects estates, local collectors, and residents across Kano State to coordinate waste pickups with real-time tracking and accountability.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button size="lg" onClick={() => navigate("/auth?view=signup&role=citizen")} className="text-lg gap-2 rounded-full px-8">
                  Get Started
                  <ArrowRight className="h-5 w-5" />
                </Button>
                <Button size="lg" variant="outline" onClick={() => navigate("/auth")} className="text-lg rounded-full px-8">
                  Sign in
                </Button>
              </div>
            </div>

            {/* Right Image */}
            <div className="relative">
              <div className="rounded-2xl overflow-hidden shadow-2xl">
                <img
                  src={wasteBinsHero}
                  alt="Colorful recycling bins for waste management"
                  className="w-full h-auto object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-card">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-foreground mb-4">
              Why Choose CleanGo?
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Designed for the realities of waste collection in Kano State.
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

      {/* How It Works Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-foreground mb-4">
              How It Works
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Getting started with CleanGo is simple. Follow these easy steps to join the movement.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-0">
            <StepCard
              step={1}
              icon={UserPlus}
              title="Sign Up"
              description="Create your free account as a citizen, company, or collector in minutes"
              isLast={false}
            />
            <StepCard
              step={2}
              icon={CalendarCheck}
              title="Request Pickup"
              description="Schedule a waste pickup at your convenience or report an issue"
              isLast={false}
            />
            <StepCard
              step={3}
              icon={Truck}
              title="Collection"
              description="A verified collector arrives, collects your waste, and confirms completion"
              isLast={false}
            />
            <div className="relative text-center px-4 opacity-70">
              <div className="relative z-20 bg-background">
                <div className="inline-flex items-center justify-center w-10 h-10 bg-muted text-muted-foreground rounded-full mb-3 text-lg font-semibold">
                  {4}
                </div>
                <div className="inline-flex items-center justify-center w-8 h-8 bg-muted/50 rounded-lg mb-3 ml-2">
                  <Gift className="w-4 h-4 text-muted-foreground" />
                </div>
                <h3 className="text-base font-medium text-muted-foreground mb-1">Earn Rewards</h3>
                <p className="text-sm text-muted-foreground/80">Optionally earn points for consistent participation, redeemable for small incentives</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-primary to-primary/80">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold text-primary-foreground mb-6">
            Fixing last-mile waste collection in Kano State
          </h2>
          <p className="text-xl text-primary-foreground/90 mb-8 max-w-2xl mx-auto">
            Built for estates and communities in Kano State.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              variant="secondary"
              onClick={() => navigate("/auth?view=signup&role=citizen")}
              className="text-lg"
            >
              Request a Pickup
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => navigate("/auth?view=signup&role=collector")}
              className="text-lg bg-transparent border-primary-foreground text-primary-foreground hover:bg-primary-foreground/10"
            >
              Join as a Collector
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-card border-t border-border py-8">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <img src={logo} alt="CleanGo Logo" className="h-10 w-auto" />
          </div>
          <div className="flex items-center justify-center gap-4 mb-4 text-sm">
            <button
              onClick={() => navigate("/contact")}
              className="text-muted-foreground hover:text-primary transition-colors"
            >
              Contact
            </button>
            <span className="text-muted-foreground">•</span>
            <button
              onClick={() => navigate("/privacy")}
              className="text-muted-foreground hover:text-primary transition-colors"
            >
              Privacy
            </button>
            <span className="text-muted-foreground">•</span>
            <button
              onClick={() => navigate("/terms")}
              className="text-muted-foreground hover:text-primary transition-colors"
            >
              Terms
            </button>
          </div>
          <p className="text-muted-foreground">
            © 2026 CleanGo. All rights reserved. Building sustainable communities together.
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

interface StepCardProps {
  step: number;
  icon: any;
  title: string;
  description: string;
  isLast: boolean;
}

const StepCard = ({ step, icon: Icon, title, description, isLast }: StepCardProps) => {
  return (
    <div className="relative text-center px-4">
      {/* Connecting arrow - hidden on mobile, shown on lg screens */}
      {!isLast && (
        <div className="hidden lg:flex absolute top-8 -right-2 z-10 items-center justify-center">
          <ChevronRight className="w-8 h-8 text-primary" />
        </div>
      )}

      {/* Connecting line - hidden on mobile, shown on lg screens */}
      {!isLast && (
        <div className="hidden lg:block absolute top-8 left-1/2 w-full h-0.5 bg-gradient-to-r from-primary/50 to-primary/20" />
      )}

      <div className="relative z-20 bg-background">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-primary text-primary-foreground rounded-full mb-4 text-2xl font-bold shadow-lg">
          {step}
        </div>
        <div className="inline-flex items-center justify-center w-12 h-12 bg-primary/10 rounded-xl mb-4 ml-2">
          <Icon className="w-6 h-6 text-primary" />
        </div>
        <h3 className="text-xl font-semibold text-foreground mb-2">{title}</h3>
        <p className="text-muted-foreground">{description}</p>
      </div>
    </div>
  );
};


export default Index;
