import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
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
            <div className="flex items-center gap-3">
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
                CWaMSo connects citizens, collectors, and authorities through a digital platform that ensures smarter, cleaner communities.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button size="lg" onClick={() => navigate("/auth")} className="text-lg gap-2 rounded-full px-8">
                  Get Started
                  <ArrowRight className="h-5 w-5" />
                </Button>
                <Button size="lg" variant="outline" onClick={() => navigate("/auth")} className="text-lg rounded-full px-8">
                  Learn More
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
    </div>
  );
};


export default Index;
