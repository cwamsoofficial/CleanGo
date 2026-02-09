import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Crown, Sparkles, Loader2, Settings, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useSubscription, PREMIUM_TIERS } from "@/contexts/SubscriptionContext";
import { useState } from "react";

export const SubscriptionTab = () => {
  const navigate = useNavigate();
  const { isSubscribed, tier, subscriptionEnd, isLoading } = useSubscription();
  const [isPortalLoading, setIsPortalLoading] = useState(false);

  const handleManageSubscription = async () => {
    setIsPortalLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("customer-portal");
      if (error) throw error;
      if (data?.url) window.open(data.url, "_blank");
    } catch {
      toast.error("Failed to open subscription management.");
    } finally {
      setIsPortalLoading(false);
    }
  };

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString("en-NG", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (isSubscribed) {
    return (
      <div className="space-y-6">
        <Card className="border-primary bg-primary/5">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Crown className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">Your Subscription</CardTitle>
              </div>
              <Badge variant="default" className="bg-primary">
                {tier === "pro" ? PREMIUM_TIERS.pro.name : PREMIUM_TIERS.basic.name}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">
                Your subscription renews on{" "}
                <span className="font-medium text-foreground">
                  {subscriptionEnd ? formatDate(subscriptionEnd) : "N/A"}
                </span>
              </p>
            </div>
            <div className="border-t pt-4">
              <p className="text-sm font-medium mb-2">Your plan includes:</p>
              <ul className="space-y-2 text-sm">
                {PREMIUM_TIERS[tier === "pro" ? "pro" : "basic"].features.map((feature, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          </CardContent>
          <CardFooter>
            <Button
              variant="outline"
              onClick={handleManageSubscription}
              disabled={isPortalLoading}
              className="w-full"
            >
              {isPortalLoading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Settings className="h-4 w-4 mr-2" />
              )}
              Manage Subscription
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // Free user view
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Normal Plan</CardTitle>
          <CardDescription>You're currently on the Normal Plan</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-center gap-2">
              <Check className="h-4 w-4" />
              Basic pickup scheduling
            </li>
            <li className="flex items-center gap-2">
              <Check className="h-4 w-4" />
              Monthly pickup only
            </li>
            <li className="flex items-center gap-2">
              <Check className="h-4 w-4" />
              Standard rewards on pickups
            </li>
            <li className="flex items-center gap-2">
              <Check className="h-4 w-4" />
              Community support
            </li>
          </ul>
        </CardContent>
      </Card>

      <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Upgrade to Premium</CardTitle>
          </div>
          <CardDescription>Unlock priority pickups, bonus rewards, and more</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            <li className="flex items-center gap-2">
              <Check className="h-4 w-4 text-primary" />
              Bi-weekly or Monthly pickup options
            </li>
            <li className="flex items-center gap-2">
              <Check className="h-4 w-4 text-primary" />
              Priority pickup scheduling
            </li>
            <li className="flex items-center gap-2">
              <Check className="h-4 w-4 text-primary" />
              Bonus rewards on every pickup
            </li>
            <li className="flex items-center gap-2">
              <Check className="h-4 w-4 text-primary" />
              Priority support
            </li>
          </ul>
        </CardContent>
        <CardFooter>
          <Button className="w-full gap-2" onClick={() => navigate("/dashboard/billing")}>
            View Plans & Upgrade
            <ArrowRight className="h-4 w-4" />
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};
