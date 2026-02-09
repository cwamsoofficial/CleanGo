import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { getUserRole, type UserRole } from "@/lib/supabase";
import { useSubscription, PREMIUM_TIERS, type PremiumTier } from "@/contexts/SubscriptionContext";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CreditCard, TrendingUp, Check, Crown, Sparkles, Loader2, Settings } from "lucide-react";
import { toast } from "sonner";

const Billing = () => {
  const [role, setRole] = useState<UserRole | null>(null);
  const [isCheckoutLoading, setIsCheckoutLoading] = useState<string | null>(null);
  const [isPortalLoading, setIsPortalLoading] = useState(false);
  const [searchParams] = useSearchParams();
  const { isSubscribed, tier, subscriptionEnd, isLoading, checkSubscription } = useSubscription();

  useEffect(() => {
    const fetchRole = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const userRole = await getUserRole(user.id);
        setRole(userRole);
      }
    };
    fetchRole();
  }, []);

  // Handle success/cancel from Stripe checkout
  useEffect(() => {
    if (searchParams.get("success") === "true") {
      toast.success("Subscription successful! Welcome to Premium.");
      checkSubscription();
    } else if (searchParams.get("canceled") === "true") {
      toast.info("Subscription canceled.");
    }
  }, [searchParams, checkSubscription]);

  const handleSubscribe = async (tierKey: "basic" | "pro") => {
    setIsCheckoutLoading(tierKey);
    try {
      const priceId = PREMIUM_TIERS[tierKey].priceId;
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: { priceId },
      });

      if (error) throw error;

      if (data?.url) {
        window.open(data.url, "_blank");
      }
    } catch (error) {
      console.error("Checkout error:", error);
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

      if (data?.url) {
        window.open(data.url, "_blank");
      }
    } catch (error) {
      console.error("Portal error:", error);
      toast.error("Failed to open subscription management. Please try again.");
    } finally {
      setIsPortalLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-NG", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  // Admin view
  if (role === "admin") {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div>
            <h2 className="text-3xl font-bold text-foreground">Billing Activity</h2>
            <p className="text-muted-foreground mt-1">Monitor payment activities across the platform</p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Coming Soon</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-12">
                <TrendingUp className="h-12 w-12 text-muted-foreground/50" />
                <p className="mt-4 text-muted-foreground text-center">
                  Admin billing analytics are currently under development.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  // Collector view
  if (role === "collector") {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div>
            <h2 className="text-3xl font-bold text-foreground">Payments</h2>
            <p className="text-muted-foreground mt-1">Manage your payment confirmations</p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Coming Soon</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-12">
                <CreditCard className="h-12 w-12 text-muted-foreground/50" />
                <p className="mt-4 text-muted-foreground text-center">
                  Payment features are currently under development.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  // Citizen/Company view with premium subscription
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Billing & Subscription</h2>
          <p className="text-muted-foreground mt-1">Manage your premium subscription and billing</p>
        </div>

        {/* Current Subscription Status */}
        {isSubscribed && (
          <Card className="border-primary bg-primary/5">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Crown className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg">Current Subscription</CardTitle>
                </div>
                <Badge variant="default" className="bg-primary">
                  {tier === "pro" ? "Premium Pro" : "Premium Basic"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">
                    Your subscription renews on{" "}
                    <span className="font-medium text-foreground">
                      {subscriptionEnd ? formatDate(subscriptionEnd) : "N/A"}
                    </span>
                  </p>
                </div>
                <Button
                  variant="outline"
                  onClick={handleManageSubscription}
                  disabled={isPortalLoading}
                >
                  {isPortalLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Settings className="h-4 w-4 mr-2" />
                  )}
                  Manage Subscription
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Pricing Cards */}
        <div data-pricing className="grid gap-6 md:grid-cols-2">
          {/* Basic Tier */}
          <Card className={`relative ${tier === "basic" ? "border-primary ring-2 ring-primary" : ""}`}>
            {tier === "basic" && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <Badge className="bg-primary">Your Plan</Badge>
              </div>
            )}
            <CardHeader>
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
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
                <Badge className="bg-primary">Your Plan</Badge>
              </div>
            ) : (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <Badge variant="secondary">Most Popular</Badge>
              </div>
            )}
            <CardHeader>
              <div className="flex items-center gap-2">
                <Crown className="h-5 w-5 text-primary" />
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

        {/* Free Plan + Upgrade cards for non-subscribers */}
        {!isSubscribed && (
          <>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Free Plan</CardTitle>
                <CardDescription>You're currently on the Free Plan</CardDescription>
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
                  <Crown className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg">Upgrade Plan (Paid)</CardTitle>
                </div>
                <CardDescription>Choose a pickup schedule that works for you</CardDescription>
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
                <Button
                  className="w-full"
                  onClick={() => {
                    const pricingSection = document.querySelector('[data-pricing]');
                    pricingSection?.scrollIntoView({ behavior: 'smooth' });
                  }}
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  Upgrade &amp; Choose Plan
                </Button>
              </CardFooter>
            </Card>
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Billing;
