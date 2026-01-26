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
    description: "Click here to schedule a waste collection. Enter your location and preferred date for the collector.",
    position: "left"
  },
  {
    target: "[data-tour='report-issue']",
    title: "Report Issues",
    description: "See overflowing bins or illegal dumping? Report it here with photos and location details.",
    position: "left"
  },
  {
    target: "[data-tour='nav-my-pickups']",
    title: "My Pickups",
    description: "View all your scheduled pickups. Request new collections and track the status of each pickup.",
    position: "right"
  },
  {
    target: "[data-tour='nav-report-issue']",
    title: "Report Issue",
    description: "Report waste management issues in your area with photos and location details.",
    position: "right"
  },
  {
    target: "[data-tour='nav-rewards']",
    title: "Rewards & Earnings",
    description: "View your earnings, redeem rewards, and track your referral bonuses. Earn ₦100 per completed pickup!",
    position: "right"
  },
  {
    target: "[data-tour='nav-leaderboard']",
    title: "Community Leaderboard",
    description: "Compete with other community members! Top earners get special achievement badges.",
    position: "right"
  },
  {
    target: "[data-tour='nav-achievements']",
    title: "Your Achievements",
    description: "Track your badges and milestones. Complete challenges to unlock special rewards!",
    position: "right"
  }
];

const collectorTourSteps: TourStep[] = [
  {
    target: "[data-tour='dashboard-stats']",
    title: "Your Collection Stats",
    description: "Track your assigned pickups, pending collections, completed jobs, and issues to resolve.",
    position: "bottom"
  },
  {
    target: "[data-tour='nav-pickups']",
    title: "Pickups Management",
    description: "View available and accepted pickups. Accept new requests, update status, and complete collections.",
    position: "right"
  },
  {
    target: "[data-tour='nav-issues']",
    title: "Issues Management",
    description: "View reported issues in your area. Accept, investigate, and resolve them to earn ₦50 per resolution!",
    position: "right"
  },
  {
    target: "[data-tour='nav-activity-history']",
    title: "Activity History",
    description: "View your complete collection and issue resolution history over time.",
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
      
      // Spotlight position (viewport coordinates for fixed overlay)
      setSpotlightPos({
        top: rect.top - padding,
        left: rect.left - padding,
        width: rect.width + padding * 2,
        height: rect.height + padding * 2
      });

      // Tooltip position (viewport coordinates for fixed container)
      const tooltipWidth = 320;
      const tooltipHeight = 200;
      const gap = 12;

      let top = 0;
      let left = 0;
      let arrowPosition: "top" | "bottom" | "left" | "right" = "top";

      switch (step.position) {
        case "bottom":
          top = rect.bottom + gap;
          left = rect.left + (rect.width / 2) - (tooltipWidth / 2);
          arrowPosition = "top";
          break;
        case "top":
          top = rect.top - tooltipHeight - gap;
          left = rect.left + (rect.width / 2) - (tooltipWidth / 2);
          arrowPosition = "bottom";
          break;
        case "left":
          top = rect.top + (rect.height / 2) - (tooltipHeight / 2);
          left = rect.left - tooltipWidth - gap;
          arrowPosition = "right";
          break;
        case "right":
        default:
          top = rect.top + (rect.height / 2) - (tooltipHeight / 2);
          left = rect.right + gap;
          arrowPosition = "left";
          break;
      }

      // Keep tooltip within viewport
      left = Math.max(16, Math.min(left, window.innerWidth - tooltipWidth - 16));
      top = Math.max(16, Math.min(top, window.innerHeight - tooltipHeight - 16));

      setTooltipPos({ top, left, arrowPosition });
    } else {
      // Fallback: center the tooltip
      setSpotlightPos(null);
      setTooltipPos({
        top: window.innerHeight / 2 - 100,
        left: window.innerWidth / 2 - 160,
        arrowPosition: "top"
      });
    }
  }, [step]);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Scroll element into view and calculate positions
  useEffect(() => {
    if (!mounted || !step) return;
    
    const scrollAndPosition = () => {
      const element = document.querySelector(step.target);
      
      if (element) {
        // Check if element is in viewport
        const rect = element.getBoundingClientRect();
        const isInViewport = 
          rect.top >= 0 &&
          rect.left >= 0 &&
          rect.bottom <= window.innerHeight &&
          rect.right <= window.innerWidth;
        
        if (!isInViewport) {
          // Scroll element into view with smooth animation
          element.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
            inline: 'center'
          });
          
          // Wait for scroll to complete before calculating positions
          setTimeout(calculatePositions, 400);
        } else {
          calculatePositions();
        }
      } else {
        calculatePositions();
      }
    };
    
    // Small delay to ensure DOM is ready
    const timeout = setTimeout(scrollAndPosition, 100);
    
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
  }, [calculatePositions, mounted, currentStep, step]);

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
      className={`fixed inset-0 z-[99999] transition-opacity duration-300 ${
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
          fill="rgba(0, 0, 0, 0.85)"
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
            zIndex: 99999
          }}
        />
      )}

      {/* Tooltip */}
      {tooltipPos && (
        <Card 
          className="absolute w-80 shadow-2xl border-primary/30 animate-fade-in bg-card"
          style={{
            top: tooltipPos.top,
            left: tooltipPos.left,
            zIndex: 100000
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
