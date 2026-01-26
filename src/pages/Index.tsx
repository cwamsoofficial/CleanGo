import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ArrowRight, Recycle, Users, TrendingUp, Shield, Clock, Leaf, UserPlus, CalendarCheck, Truck, Gift, ChevronRight } from "lucide-react";
import logo from "@/assets/cwamso-logo.png";
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
              <img src={logo} alt="CWaMSo Logo" className="h-12 w-auto" />
              <span className="text-2xl font-bold text-foreground">CWaMSo</span>
            </div>
            <Button onClick={() => navigate("/auth")} size="lg" className="rounded-full px-8">
              Login
            </Button>
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
                A Smart Digital Solution for Cleaner Communities in Nigeria
              </h1>
              <p className="text-xl text-muted-foreground leading-relaxed">
                CWaMSo connects citizens, collectors, and companies through a digital platform that ensures smarter, cleaner communities.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button size="lg" onClick={() => navigate("/auth?view=signup")} className="text-lg gap-2 rounded-full px-8">
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

      {/* How It Works Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-foreground mb-4">
              How It Works
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Getting started with CWaMSo is simple. Follow these easy steps to join the movement.
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
            <StepCard
              step={4}
              icon={Gift}
              title="Earn Rewards"
              description="Get points for every pickup and redeem them for exciting rewards"
              isLast={true}
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
            onClick={() => navigate("/auth?view=signup")}
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
            © 2026 CWaMSo. All rights reserved. Building sustainable communities together.
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
