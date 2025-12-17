import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { 
  X,
  ChevronRight,
  ChevronLeft,
  Sparkles
} from "lucide-react";
import { createPortal } from "react-dom";

interface TourStep {
  target: string; // CSS selector for the element to highlight
  title: string;
  description: string;
  position?: "top" | "bottom" | "left" | "right";
  fallbackPosition?: { top: number; left: number }; // For when element isn't found
}

const citizenTourSteps: TourStep[] = [
  {
    target: "[data-tour='dashboard-stats']",
    title: "Your Activity Overview",
    description: "These cards show your pickups, pending requests, completed collections, and reward points at a glance.",
    position: "bottom"
  },
  {
    target: "[data-tour='request-pickup']",
    title: "Request a Pickup",
    description: "Click here to schedule a waste collection. Enter your location and any special notes for the collector.",
    position: "bottom"
  },
  {
    target: "[data-tour='report-issue']",
    title: "Report Issues",
    description: "See overflowing bins or illegal dumping? Report it here with photos and location details.",
    position: "bottom"
  },
  {
    target: "[data-tour='nav-my-pickups']",
    title: "Pickups Page",
    description: "View all your scheduled and completed pickups. Track the status of each collection request.",
    position: "right"
  },
  {
    target: "[data-tour='nav-report-issue']",
    title: "Report Issues Page",
    description: "View and manage all your reported issues. Check their status and see resolution updates.",
    position: "right"
  },
  {
    target: "[data-tour='nav-rewards']",
    title: "Rewards & Earnings",
    description: "View your earnings, redeem rewards, and track your referral bonuses here. Earn ₦100 per completed pickup!",
    position: "right"
  },
  {
    target: "[data-tour='nav-leaderboard']",
    title: "Community Leaderboard",
    description: "Compete with other community members! Top earners get special achievement badges.",
    position: "right"
  }
];

const collectorTourSteps: TourStep[] = [
  {
    target: "[data-tour='dashboard-stats']",
    title: "Your Collection Stats",
    description: "Track your assigned pickups, pending collections, and completed jobs here.",
    position: "bottom"
  },
  {
    target: "[data-tour='nav-pickups']",
    title: "Pickups Management",
    description: "Access available and assigned pickups. View statistics, accept requests, and update pickup statuses.",
    position: "right"
  },
  {
    target: "[data-tour='pickup-stats']",
    title: "Pickup Statistics",
    description: "See total available pickups, your assigned pickups, and completed pickups for today at a glance.",
    position: "bottom",
    fallbackPosition: { top: 200, left: 400 }
  },
  {
    target: "[data-tour='pickup-list']",
    title: "Pickup List",
    description: "Browse all pickups here. Accept unassigned ones, update status, or unassign yourself if needed.",
    position: "bottom",
    fallbackPosition: { top: 350, left: 400 }
  },
  {
    target: "[data-tour='nav-issues']",
    title: "Issues Management",
    description: "View all reported issues. Accept, investigate, and resolve them to earn ₦50 per resolution!",
    position: "right"
  },
  {
    target: "[data-tour='issue-list']",
    title: "Issue List",
    description: "See reported problems with photos and locations. Update status as you work on resolving them.",
    position: "bottom",
    fallbackPosition: { top: 350, left: 400 }
  },
  {
    target: "[data-tour='nav-analytics']",
    title: "Your Analytics",
    description: "Track your performance, completion rates, and pickup trends over time.",
    position: "right"
  },
  {
    target: "[data-tour='nav-leaderboard']",
    title: "Leaderboard",
    description: "See how you rank among other collectors and compete for top spots!",
    position: "right"
  },
  {
    target: "[data-tour='nav-payments']",
    title: "Your Earnings",
    description: "View your total earnings, maintain streaks for bonuses, and withdraw your money!",
    position: "right"
  }
];

interface SpotlightPosition {
  top: number;
  left: number;
  width: number;
  height: number;
}

interface TooltipPosition {
  top: number;
  left: number;
  arrowPosition: "top" | "bottom" | "left" | "right";
}

interface InteractiveTourProps {
  onComplete: () => void;
  onSkip: () => void;
  role?: "citizen" | "company" | "collector";
}

export const InteractiveTour = ({ onComplete, onSkip, role = "citizen" }: InteractiveTourProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [spotlightPos, setSpotlightPos] = useState<SpotlightPosition | null>(null);
  const [tooltipPos, setTooltipPos] = useState<TooltipPosition | null>(null);
  const [mounted, setMounted] = useState(false);
  const resizeTimeoutRef = useRef<NodeJS.Timeout>();

  const steps = role === "collector" ? collectorTourSteps : citizenTourSteps;
  const step = steps[currentStep];
  const progress = ((currentStep + 1) / steps.length) * 100;
  const isLastStep = currentStep === steps.length - 1;
  const isFirstStep = currentStep === 0;

  const calculatePositions = useCallback(() => {
    if (!step) return;

    const element = document.querySelector(step.target);
    
    if (element) {
      const rect = element.getBoundingClientRect();
      const padding = 8;
      
      // Spotlight position
      setSpotlightPos({
        top: rect.top - padding + window.scrollY,
        left: rect.left - padding,
        width: rect.width + padding * 2,
        height: rect.height + padding * 2
      });

      // Tooltip position
      const tooltipWidth = 320;
      const tooltipHeight = 180;
      const gap = 16;

      let top = 0;
      let left = 0;
      let arrowPosition: "top" | "bottom" | "left" | "right" = "top";

      switch (step.position) {
        case "bottom":
          top = rect.bottom + gap + window.scrollY;
          left = rect.left + (rect.width / 2) - (tooltipWidth / 2);
          arrowPosition = "top";
          break;
        case "top":
          top = rect.top - tooltipHeight - gap + window.scrollY;
          left = rect.left + (rect.width / 2) - (tooltipWidth / 2);
          arrowPosition = "bottom";
          break;
        case "left":
          top = rect.top + (rect.height / 2) - (tooltipHeight / 2) + window.scrollY;
          left = rect.left - tooltipWidth - gap;
          arrowPosition = "right";
          break;
        case "right":
        default:
          top = rect.top + (rect.height / 2) - (tooltipHeight / 2) + window.scrollY;
          left = rect.right + gap;
          arrowPosition = "left";
          break;
      }

      // Keep tooltip within viewport
      left = Math.max(16, Math.min(left, window.innerWidth - tooltipWidth - 16));
      top = Math.max(16, top);

      setTooltipPos({ top, left, arrowPosition });
    } else {
      // Fallback: center the tooltip
      setSpotlightPos(null);
      setTooltipPos({
        top: window.innerHeight / 2 - 90,
        left: window.innerWidth / 2 - 160,
        arrowPosition: "top"
      });
    }
  }, [step]);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    
    // Small delay to ensure DOM is ready
    const timeout = setTimeout(calculatePositions, 100);
    
    const handleResize = () => {
      if (resizeTimeoutRef.current) {
        clearTimeout(resizeTimeoutRef.current);
      }
      resizeTimeoutRef.current = setTimeout(calculatePositions, 100);
    };

    window.addEventListener("resize", handleResize);
    window.addEventListener("scroll", calculatePositions);

    return () => {
      clearTimeout(timeout);
      if (resizeTimeoutRef.current) {
        clearTimeout(resizeTimeoutRef.current);
      }
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("scroll", calculatePositions);
    };
  }, [calculatePositions, mounted, currentStep]);

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

  if (!mounted || !isVisible) return null;

  const getArrowStyles = (position: "top" | "bottom" | "left" | "right") => {
    const base = "absolute w-3 h-3 bg-card rotate-45 border-border";
    switch (position) {
      case "top":
        return `${base} -top-1.5 left-1/2 -translate-x-1/2 border-l border-t`;
      case "bottom":
        return `${base} -bottom-1.5 left-1/2 -translate-x-1/2 border-r border-b`;
      case "left":
        return `${base} top-1/2 -left-1.5 -translate-y-1/2 border-l border-b`;
      case "right":
        return `${base} top-1/2 -right-1.5 -translate-y-1/2 border-r border-t`;
    }
  };

  return createPortal(
    <div 
      className={`fixed inset-0 z-[100] transition-opacity duration-300 ${
        isVisible ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
    >
      {/* Overlay with spotlight cutout */}
      <svg className="absolute inset-0 w-full h-full" style={{ pointerEvents: "none" }}>
        <defs>
          <mask id="spotlight-mask">
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            {spotlightPos && (
              <rect
                x={spotlightPos.left}
                y={spotlightPos.top}
                width={spotlightPos.width}
                height={spotlightPos.height}
                rx="8"
                fill="black"
              />
            )}
          </mask>
        </defs>
        <rect
          x="0"
          y="0"
          width="100%"
          height="100%"
          fill="rgba(0, 0, 0, 0.75)"
          mask="url(#spotlight-mask)"
          style={{ pointerEvents: "auto" }}
          onClick={handleSkip}
        />
      </svg>

      {/* Spotlight border glow */}
      {spotlightPos && (
        <div
          className="absolute rounded-lg border-2 border-primary shadow-[0_0_20px_rgba(var(--primary),0.5)] pointer-events-none animate-pulse"
          style={{
            top: spotlightPos.top,
            left: spotlightPos.left,
            width: spotlightPos.width,
            height: spotlightPos.height,
          }}
        />
      )}

      {/* Tooltip */}
      {tooltipPos && (
        <Card 
          className="absolute w-80 shadow-2xl border-primary/30 animate-fade-in"
          style={{
            top: tooltipPos.top,
            left: tooltipPos.left,
            zIndex: 101
          }}
        >
          {/* Arrow */}
          <div className={getArrowStyles(tooltipPos.arrowPosition)} />
          
          <CardContent className="p-4 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-full bg-primary/10">
                  <Sparkles className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">
                    Step {currentStep + 1} of {steps.length}
                  </p>
                  <h3 className="font-semibold text-sm">{step.title}</h3>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 -mt-1 -mr-1"
                onClick={handleSkip}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>

            <Progress value={progress} className="h-1" />

            <p className="text-sm text-muted-foreground leading-relaxed">
              {step.description}
            </p>

            {/* Step indicators */}
            <div className="flex justify-center gap-1 py-1">
              {steps.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentStep(index)}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    index === currentStep 
                      ? "w-4 bg-primary" 
                      : index < currentStep 
                      ? "w-1.5 bg-primary/50" 
                      : "w-1.5 bg-muted"
                  }`}
                />
              ))}
            </div>

            <div className="flex items-center justify-between pt-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={handlePrev}
                disabled={isFirstStep}
                className="gap-1 h-8 text-xs"
              >
                <ChevronLeft className="h-3 w-3" />
                Back
              </Button>

              <div className="flex gap-2">
                {!isLastStep && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={handleSkip}
                    className="h-8 text-xs"
                  >
                    Skip
                  </Button>
                )}
                <Button 
                  size="sm" 
                  onClick={handleNext} 
                  className="gap-1 h-8 text-xs"
                >
                  {isLastStep ? "Done" : "Next"}
                  {!isLastStep && <ChevronRight className="h-3 w-3" />}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>,
    document.body
  );
};

export default InteractiveTour;
