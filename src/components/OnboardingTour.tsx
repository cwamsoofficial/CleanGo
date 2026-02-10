import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { 
  Package, 
  AlertCircle, 
  Gift, 
  Trophy, 
  BarChart3, 
  X,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  CheckCircle,
  MapPin,
  Clock,
  Truck,
  DollarSign,
  Users
} from "lucide-react";

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  tip: string;
}

const citizenSteps: OnboardingStep[] = [
  {
    id: "welcome",
    title: "Welcome to CleanGo!",
    description: "Your community waste management platform. Let's take a quick tour to help you get started.",
    icon: Sparkles,
    tip: "This tour will only take a minute and will help you understand all the features available to you."
  },
  {
    id: "dashboard",
    title: "Your Dashboard",
    description: "This is your home base. View your pickups, pending requests, completed collections, and reward points at a glance.",
    icon: BarChart3,
    tip: "Check your dashboard regularly to stay updated on your waste management activities."
  },
  {
    id: "pickups",
    title: "Request Waste Pickups",
    description: "Schedule waste collection by clicking 'Request Pickup'. Enter your location, preferred date, and a collector will handle it.",
    icon: Package,
    tip: "You earn ₦100 for every completed pickup! The more you recycle, the more you earn."
  },
  {
    id: "issues",
    title: "Report Issues",
    description: "See overflowing bins or illegal dumping? Report issues with photos and location. Collectors will be notified to resolve them.",
    icon: AlertCircle,
    tip: "Reporting issues helps keep your community clean and earns you bonus points."
  },
  {
    id: "rewards",
    title: "Earn Rewards",
    description: "Complete pickups and maintain streaks to earn money! Redeem your points for airtime, badges, or withdraw directly.",
    icon: Gift,
    tip: "Keep a 14-day streak for ₦3,000 bonus, and 30-day streak for ₦10,000 bonus!"
  },
  {
    id: "leaderboard",
    title: "Community Leaderboard",
    description: "Compete with other community members! Top earners are displayed on the leaderboard with special achievement badges.",
    icon: Trophy,
    tip: "Invite friends with your referral code - you'll earn ₦500 when they complete their first pickup!"
  },
  {
    id: "complete",
    title: "You're All Set!",
    description: "You're ready to start making a difference in your community. Let's keep our environment clean together!",
    icon: CheckCircle,
    tip: "Start by requesting your first pickup from the dashboard."
  }
];

const collectorSteps: OnboardingStep[] = [
  {
    id: "welcome",
    title: "Welcome, Collector!",
    description: "You're now part of the CleanGo waste collection team. Let's show you how to manage pickups efficiently.",
    icon: Truck,
    tip: "This quick tour will help you understand your role and maximize your earnings."
  },
  {
    id: "dashboard",
    title: "Your Collector Dashboard",
    description: "Your dashboard shows your assigned pickups, pending collections, completed jobs, and issues to resolve.",
    icon: BarChart3,
    tip: "Check your dashboard frequently to see your performance summary."
  },
  {
    id: "pickups-available",
    title: "Available Pickups",
    description: "Go to Pickups to see requests waiting to be accepted. Accept pickups to assign them to yourself.",
    icon: Package,
    tip: "Accept pickups quickly - they're available on a first-come, first-served basis!"
  },
  {
    id: "accept-pickup",
    title: "Accept & Complete Pickups",
    description: "Click 'Accept' on available pickups to claim them. Update status as you progress: In Progress → Collected.",
    icon: CheckCircle,
    tip: "If you can't complete a pickup, use 'Unassign' to release it back to available pickups."
  },
  {
    id: "issues",
    title: "Resolve Reported Issues",
    description: "The Issues page shows problems reported by citizens. Accept and resolve issues to earn extra points.",
    icon: AlertCircle,
    tip: "Resolving issues earns you ₦50 per resolution - a great way to boost your income!"
  },
  {
    id: "complete",
    title: "Ready to Collect!",
    description: "You're all set to start collecting waste and earning money. Head to Pickups to accept your first collection!",
    icon: CheckCircle,
    tip: "Check the Available Pickups tab to find new pickup requests in your area."
  }
];

interface OnboardingTourProps {
  onComplete: () => void;
  onSkip: () => void;
  role?: "citizen" | "company" | "collector";
}

export const OnboardingTour = ({ onComplete, onSkip, role = "citizen" }: OnboardingTourProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  const steps = role === "collector" ? collectorSteps : citizenSteps;
  const step = steps[currentStep];
  const progress = ((currentStep + 1) / steps.length) * 100;
  const isLastStep = currentStep === steps.length - 1;
  const isFirstStep = currentStep === 0;

  const handleNext = () => {
    if (isLastStep) {
      setIsVisible(false);
      setTimeout(onComplete, 300);
    } else {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (!isFirstStep) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleSkip = () => {
    setIsVisible(false);
    setTimeout(onSkip, 300);
  };

  const Icon = step.icon;

  return (
    <div 
      className={`fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm transition-opacity duration-300 ${
        isVisible ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
    >
      <Card className="w-full max-w-lg mx-4 shadow-2xl border-primary/20 animate-scale-in">
        <CardHeader className="relative pb-2">
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-4 top-4"
            onClick={handleSkip}
          >
            <X className="h-4 w-4" />
          </Button>
          
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 rounded-full bg-primary/10">
              <Icon className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">
                Step {currentStep + 1} of {steps.length}
              </p>
              <CardTitle className="text-xl">{step.title}</CardTitle>
            </div>
          </div>
          
          <Progress value={progress} className="h-1.5 mt-2" />
        </CardHeader>

        <CardContent className="space-y-4">
          <CardDescription className="text-base leading-relaxed">
            {step.description}
          </CardDescription>

          <div className="bg-primary/5 border border-primary/10 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <Sparkles className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
              <p className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">Pro tip:</span> {step.tip}
              </p>
            </div>
          </div>

          {/* Step indicators */}
          <div className="flex justify-center gap-1.5 pt-2">
            {steps.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentStep(index)}
                className={`h-2 rounded-full transition-all duration-300 ${
                  index === currentStep 
                    ? "w-6 bg-primary" 
                    : index < currentStep 
                    ? "w-2 bg-primary/50" 
                    : "w-2 bg-muted"
                }`}
              />
            ))}
          </div>

          <div className="flex items-center justify-between pt-4">
            <Button
              variant="ghost"
              onClick={handlePrev}
              disabled={isFirstStep}
              className="gap-1"
            >
              <ChevronLeft className="h-4 w-4" />
              Back
            </Button>

            <div className="flex gap-2">
              {!isLastStep && (
                <Button variant="outline" onClick={handleSkip}>
                  Skip Tour
                </Button>
              )}
              <Button onClick={handleNext} className="gap-1">
                {isLastStep ? "Get Started" : "Next"}
                {!isLastStep && <ChevronRight className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Hook to manage onboarding state - persists per user to avoid re-showing
export const useOnboarding = () => {
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [hasChecked, setHasChecked] = useState(false);
  const userIdRef = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const checkOnboarding = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (cancelled || !user) {
          if (!cancelled) setHasChecked(true);
          return;
        }

        userIdRef.current = user.id;
        const key = `cleango_onboarding_completed_${user.id}`;
        // Also check legacy key for backwards compat
        const completed = localStorage.getItem(key) || localStorage.getItem("cleango_onboarding_completed");
        
        if (!completed) {
          setShowOnboarding(true);
        } else {
          // Migrate legacy key to per-user key
          if (!localStorage.getItem(key)) {
            localStorage.setItem(key, "true");
          }
          setShowOnboarding(false);
        }
        setHasChecked(true);
      } catch {
        if (!cancelled) setHasChecked(true);
      }
    };

    checkOnboarding();
    return () => { cancelled = true; };
  }, []);

  const completeOnboarding = useCallback(() => {
    if (userIdRef.current) {
      localStorage.setItem(`cleango_onboarding_completed_${userIdRef.current}`, "true");
    }
    localStorage.setItem("cleango_onboarding_completed", "true");
    setShowOnboarding(false);
  }, []);

  const skipOnboarding = useCallback(() => {
    if (userIdRef.current) {
      localStorage.setItem(`cleango_onboarding_completed_${userIdRef.current}`, "true");
    }
    localStorage.setItem("cleango_onboarding_completed", "true");
    setShowOnboarding(false);
  }, []);

  const resetOnboarding = useCallback(() => {
    if (userIdRef.current) {
      localStorage.removeItem(`cleango_onboarding_completed_${userIdRef.current}`);
    }
    localStorage.removeItem("cleango_onboarding_completed");
    setShowOnboarding(true);
  }, []);

  return {
    showOnboarding,
    hasChecked,
    completeOnboarding,
    skipOnboarding,
    resetOnboarding
  };
};

export default OnboardingTour;
