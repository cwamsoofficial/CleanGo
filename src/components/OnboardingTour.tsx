import { useState, useEffect } from "react";
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
    title: "Welcome to CWaMSo!",
    description: "Your community waste management platform. Let's take a quick tour to help you get started.",
    icon: Sparkles,
    tip: "This tour will only take a minute and will help you understand all the features available to you."
  },
  {
    id: "dashboard",
    title: "Your Dashboard",
    description: "This is your home base. Here you can see an overview of your pickups, issues, and reward points at a glance.",
    icon: BarChart3,
    tip: "Check your dashboard regularly to stay updated on your waste management activities."
  },
  {
    id: "pickups",
    title: "Request Waste Pickups",
    description: "Schedule waste collection from your location. Simply click 'Request Pickup', enter your details, and a collector will be assigned.",
    icon: Package,
    tip: "You earn ₦100 for every completed pickup! The more you recycle, the more you earn."
  },
  {
    id: "issues",
    title: "Report Issues",
    description: "See overflowing bins or illegal dumping? Report issues with photos and location. Collectors will be notified to resolve them.",
    icon: AlertCircle,
    tip: "Reporting issues helps keep your community clean and collectors get rewarded for resolving them."
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
    tip: "Start by requesting your first pickup or exploring the dashboard."
  }
];

const collectorSteps: OnboardingStep[] = [
  {
    id: "welcome",
    title: "Welcome, Collector!",
    description: "You're now part of the CWaMSo waste collection team. Let's show you how to manage pickups efficiently.",
    icon: Truck,
    tip: "This quick tour will help you understand your role and maximize your earnings."
  },
  {
    id: "dashboard",
    title: "Your Collector Dashboard",
    description: "Your dashboard shows assigned pickups, pending requests, and completed collections. Monitor your performance at a glance.",
    icon: BarChart3,
    tip: "Check your dashboard frequently to see new pickup requests in your area."
  },
  {
    id: "pickups-list",
    title: "View Available Pickups",
    description: "Go to the Pickups page to see all available pickup requests. Unassigned pickups are marked and waiting for a collector.",
    icon: Package,
    tip: "Accept pickups quickly - they're available on a first-come, first-served basis!"
  },
  {
    id: "accept-pickup",
    title: "Accept & Manage Pickups",
    description: "Click 'Accept Pickup' to assign yourself. Update status as you progress: In Progress → Collected. You can also mark as Delayed or Failed if needed.",
    icon: CheckCircle,
    tip: "If you can't complete a pickup, use 'Unassign' to release it back to the available pool."
  },
  {
    id: "pickup-stats",
    title: "Track Your Statistics",
    description: "At the top of the Pickups page, you'll see: Total Available, Assigned to You, and Completed Today. Use these to plan your routes.",
    icon: Clock,
    tip: "Completing more pickups means more earnings and higher rankings!"
  },
  {
    id: "issues",
    title: "Resolve Reported Issues",
    description: "The Issues page shows problems reported by citizens. Accept issues, investigate, and mark them resolved to earn extra points.",
    icon: AlertCircle,
    tip: "Resolving issues earns you ₦50 per resolution - a great way to boost your income!"
  },
  {
    id: "locations",
    title: "Location Information",
    description: "Each pickup shows the user's location. Use this to plan efficient collection routes and minimize travel time.",
    icon: MapPin,
    tip: "Group nearby pickups together to save time and complete more collections per day."
  },
  {
    id: "earnings",
    title: "Earn While You Collect",
    description: "You earn ₦100 for every completed pickup and ₦50 for resolved issues. Build streaks for bonus rewards!",
    icon: DollarSign,
    tip: "Maintain a 14-day streak for ₦3,000 bonus, 30-day streak for ₦10,000 bonus!"
  },
  {
    id: "analytics",
    title: "View Your Analytics",
    description: "The Analytics page shows your performance trends, completion rates, and pickup history. Use insights to improve your efficiency.",
    icon: BarChart3,
    tip: "Track your weekly trends to identify your most productive days and times."
  },
  {
    id: "complete",
    title: "Ready to Collect!",
    description: "You're all set to start collecting waste and earning money. Head to Pickups to accept your first collection!",
    icon: CheckCircle,
    tip: "Start by checking available pickups and accepting ones in your area."
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

// Hook to manage onboarding state
export const useOnboarding = () => {
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [hasChecked, setHasChecked] = useState(false);

  useEffect(() => {
    const completed = localStorage.getItem("cwamso_onboarding_completed");
    if (!completed) {
      setShowOnboarding(true);
    }
    setHasChecked(true);
  }, []);

  const completeOnboarding = () => {
    localStorage.setItem("cwamso_onboarding_completed", "true");
    setShowOnboarding(false);
  };

  const skipOnboarding = () => {
    localStorage.setItem("cwamso_onboarding_completed", "true");
    setShowOnboarding(false);
  };

  const resetOnboarding = () => {
    localStorage.removeItem("cwamso_onboarding_completed");
    setShowOnboarding(true);
  };

  return {
    showOnboarding,
    hasChecked,
    completeOnboarding,
    skipOnboarding,
    resetOnboarding
  };
};

export default OnboardingTour;
