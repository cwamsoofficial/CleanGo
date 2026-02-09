import { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Crown, Sparkles, Loader2, Settings as SettingsIcon } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useSubscription, PREMIUM_TIERS } from "@/contexts/SubscriptionContext";

export const SubscriptionTab = () => {
  const { isSubscribed, tier, subscriptionEnd, isLoading } = useSubscription();
  const [isCheckoutLoading, setIsCheckoutLoading] = useState<string | null>(null);
  const [isPortalLoading, setIsPortalLoading] = useState(false);

  const handleSubscribe = async (tierKey: "basic" | "pro") => {
    setIsCheckoutLoading(tierKey);
    try {
      const priceId = PREMIUM_TIERS[tierKey].priceId;
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: { priceId },
      });
      if (error) throw error;
      if (data?.url) window.open(data.url, "_blank");
    } catch {
      toast.error("Failed to start checkout. Please try again.");
    } finally {
      setIsCheckoutLoading(null);
    }
  };

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

  const formatPrice = (amount: number) =>
    new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 0,
    }).format(amount);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Current subscription status for premium users */}
      {isSubscribed && (
        <Card className="border-primary bg-primary/5">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Crown className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">Your Subscription</CardTitle>
              </div>
              <Badge variant="default" className="bg-primary flex items-center gap-1">
                {tier === "basic" && <Sparkles className="h-3 w-3 text-emerald-300" />}
                {tier === "pro" && <Crown className="h-3 w-3 text-emerald-300" />}
                {tier === "pro" ? PREMIUM_TIERS.pro.name : PREMIUM_TIERS.basic.name}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Your subscription renews on{" "}
              <span className="font-medium text-foreground">
                {subscriptionEnd ? formatDate(subscriptionEnd) : "N/A"}
              </span>
            </p>
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
                <SettingsIcon className="h-4 w-4 mr-2" />
              )}
              Manage Subscription
            </Button>
          </CardFooter>
        </Card>
      )}

      {/* Normal plan info for non-subscribers */}
      {!isSubscribed && (
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
                No reward points on pickups
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4" />
                Community support
              </li>
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Pricing Cards */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Basic Tier */}
        <Card className={`relative ${tier === "basic" ? "border-primary ring-2 ring-primary" : ""}`}>
          {tier === "basic" && (
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <Badge className="bg-primary flex items-center gap-1">
                <Sparkles className="h-3 w-3 text-emerald-300" />
                Your Plan
              </Badge>
            </div>
          )}
          <CardHeader>
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-emerald-500" />
              <CardTitle>{PREMIUM_TIERS.basic.name}</CardTitle>
            </div>
            <CardDescription>Perfect for regular users</CardDescription>
            <div className="mt-4">
              <span className="text-4xl font-bold">{formatPrice(PREMIUM_TIERS.basic.price)}</span>
              <span className="text-muted-foreground">/month</span>
            </div>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {PREMIUM_TIERS.basic.features.map((feature, index) => (
                <li key={index} className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-primary" />
                  <span className="text-sm">{feature}</span>
                </li>
              ))}
            </ul>
          </CardContent>
          <CardFooter>
            {tier === "basic" ? (
              <Button className="w-full" variant="outline" disabled>
                Current Plan
              </Button>
            ) : tier === "pro" ? (
              <Button
                className="w-full"
                variant="outline"
                onClick={handleManageSubscription}
                disabled={isPortalLoading}
              >
                Downgrade
              </Button>
            ) : (
              <Button
                className="w-full"
                onClick={() => handleSubscribe("basic")}
                disabled={isCheckoutLoading !== null || isLoading}
              >
                {isCheckoutLoading === "basic" ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                Subscribe
              </Button>
            )}
          </CardFooter>
        </Card>

        {/* Pro Tier */}
        <Card className={`relative ${tier === "pro" ? "border-primary ring-2 ring-primary" : "border-primary/50"}`}>
          {tier === "pro" ? (
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <Badge className="bg-primary flex items-center gap-1">
                <Crown className="h-3 w-3 text-emerald-300" />
                Your Plan
              </Badge>
            </div>
          ) : (
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <Badge variant="secondary">Most Popular</Badge>
            </div>
          )}
          <CardHeader>
            <div className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-emerald-500" />
              <CardTitle>{PREMIUM_TIERS.pro.name}</CardTitle>
            </div>
            <CardDescription>For power users who want it all</CardDescription>
            <div className="mt-4">
              <span className="text-4xl font-bold">{formatPrice(PREMIUM_TIERS.pro.price)}</span>
              <span className="text-muted-foreground">/month</span>
            </div>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {PREMIUM_TIERS.pro.features.map((feature, index) => (
                <li key={index} className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-primary" />
                  <span className="text-sm">{feature}</span>
                </li>
              ))}
            </ul>
          </CardContent>
          <CardFooter>
            {tier === "pro" ? (
              <Button className="w-full" variant="outline" disabled>
                Current Plan
              </Button>
            ) : tier === "basic" ? (
              <Button
                className="w-full"
                onClick={handleManageSubscription}
                disabled={isPortalLoading}
              >
                Upgrade
              </Button>
            ) : (
              <Button
                className="w-full"
                onClick={() => handleSubscribe("pro")}
                disabled={isCheckoutLoading !== null || isLoading}
              >
                {isCheckoutLoading === "pro" ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                Subscribe
              </Button>
            )}
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};
