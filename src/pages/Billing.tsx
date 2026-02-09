import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { getUserRole, type UserRole } from "@/lib/supabase";
import { useSubscription } from "@/contexts/SubscriptionContext";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CreditCard, TrendingUp, Check, Crown, Sparkles, ArrowRight } from "lucide-react";
import { toast } from "sonner";

const Billing = () => {
  const navigate = useNavigate();
  const [role, setRole] = useState<UserRole | null>(null);
  const [searchParams] = useSearchParams();
  const { isSubscribed, tier, checkSubscription } = useSubscription();

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

  // Citizen/Company view
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Billing</h2>
          <p className="text-muted-foreground mt-1">View your current plan</p>
        </div>

        {isSubscribed ? (
          <Card className="border-primary bg-primary/5">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Crown className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">
                  {tier === "pro" ? "Premium Pro" : "Premium Basic"}
                </CardTitle>
              </div>
              <CardDescription>You're on a premium plan</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Manage your subscription and view plan details in{" "}
                <Button
                  variant="link"
                  className="p-0 h-auto text-primary"
                  onClick={() => navigate("/dashboard/settings")}
                >
                  Settings → Subscription
                </Button>
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
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
                  className="w-full gap-2"
                  onClick={() => navigate("/dashboard/settings", { state: { tab: "subscription" } })}
                >
                  <Sparkles className="h-4 w-4" />
                  Upgrade &amp; Choose Plan
                  <ArrowRight className="h-4 w-4" />
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
