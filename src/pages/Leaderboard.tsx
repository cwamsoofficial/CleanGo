import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Construction, Crown, Sparkles, ArrowRight, Trophy } from "lucide-react";
import { useSubscription } from "@/contexts/SubscriptionContext";

export default function Leaderboard() {
  const navigate = useNavigate();
  const { isSubscribed } = useSubscription();

  if (!isSubscribed) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Card className="w-full max-w-lg text-center border-primary/20">
            <CardContent className="pt-12 pb-12 space-y-6">
              <div className="mx-auto w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                <Trophy className="h-10 w-10 text-primary" />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-bold flex items-center justify-center gap-2">
                  Unlock the Leaderboard
                  <Sparkles className="h-5 w-5 text-primary" />
                </h2>
                <p className="text-muted-foreground">
                  Upgrade to Premium to see community rankings and compete with other members!
                </p>
              </div>

              <div className="flex flex-col gap-3 text-left bg-muted/50 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <div className="h-3 w-3 rounded-full bg-primary" />
                  <span className="text-sm">
                    <span className="font-semibold">Premium Basic:</span> View top community rankings
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-3 w-3 rounded-full bg-primary" />
                  <span className="text-sm">
                    <span className="font-semibold">Premium Pro:</span> Full leaderboard access + bonus rewards
                  </span>
                </div>
              </div>

              <Button onClick={() => navigate("/dashboard/billing")} size="lg" className="gap-2 w-full sm:w-auto">
                Upgrade Now to View Leaderboard
                <ArrowRight className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="w-full max-w-md text-center">
          <CardContent className="pt-12 pb-12 space-y-4">
            <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Construction className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-2xl font-bold">Coming Soon</h2>
            <p className="text-muted-foreground">
              The Leaderboard feature is currently under development. Check back soon!
            </p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
