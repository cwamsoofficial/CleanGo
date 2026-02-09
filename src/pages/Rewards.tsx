import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Crown, Sparkles, ArrowRight } from "lucide-react";
import { useSubscription, PREMIUM_TIERS } from "@/contexts/SubscriptionContext";
import { useRewardsData } from "@/hooks/useRewardsData";
import { StreakCard } from "@/components/rewards/StreakCard";
import { WalletCards } from "@/components/rewards/WalletCards";
import { AvailableRewards } from "@/components/rewards/AvailableRewards";
import { TransactionHistory } from "@/components/rewards/TransactionHistory";
import { ReferralSection } from "@/components/ReferralSection";

const Rewards = () => {
  const navigate = useNavigate();
  const { isSubscribed, tier } = useSubscription();
  const { rewards, transactions, streak, loading, pointsToNaira, handleRedeem, handleWithdraw } =
    useRewardsData();

  const getBonusText = () => {
    if (tier === "pro") return "+10%";
    if (tier === "basic") return "";
    return null;
  };

  // Non-subscribed users see upsell
  if (!isSubscribed) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Card className="w-full max-w-lg text-center border-primary/20">
            <CardContent className="pt-12 pb-12 space-y-6">
              <div className="mx-auto w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                <Crown className="h-10 w-10 text-primary" />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-bold flex items-center justify-center gap-2">
                  Earn Rewards with Premium
                  <Sparkles className="h-5 w-5 text-primary" />
                </h2>
                <p className="text-muted-foreground">
                  Upgrade to Premium and earn{" "}
                  <span className="font-semibold text-primary">up to 10% bonus</span> on all your
                  pickups and activities!
                </p>
              </div>

              <div className="flex flex-col gap-3 text-left bg-muted/50 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <div className="h-3 w-3 rounded-full bg-primary" />
                  <span className="text-sm">
                    <span className="font-semibold">Premium Basic:</span> earn rewards
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-3 w-3 rounded-full bg-primary" />
                  <span className="text-sm">
                    <span className="font-semibold">Premium Pro:</span> +10% bonus rewards
                  </span>
                </div>
              </div>

              <Button
                onClick={() => navigate("/dashboard/billing")}
                size="lg"
                className="gap-2 w-full sm:w-auto"
              >
                Upgrade Now to Earn Rewards
                <ArrowRight className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  // Loading state for premium users
  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">Loading...</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Premium subscriber banner */}
        <Alert className="border-primary/30 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent">
          <Sparkles className="h-5 w-5 text-primary" />
          <AlertTitle className="text-lg font-semibold flex items-center gap-2">
            Premium Member Benefits Active
            <Crown className="h-4 w-4 text-primary" />
          </AlertTitle>
          <AlertDescription className="mt-1">
            <p className="text-muted-foreground">
              {getBonusText() ? (
                <>
                  You're earning{" "}
                  <span className="font-semibold text-primary">{getBonusText()} bonus</span> on all
                  your rewards with your{" "}
                  {tier === "pro" ? PREMIUM_TIERS.pro.name : PREMIUM_TIERS.basic.name} subscription!
                </>
              ) : (
                <>
                  You're earning rewards with your {PREMIUM_TIERS.basic.name} subscription!
                </>
              )}
            </p>
          </AlertDescription>
        </Alert>

        <div>
          <h2 className="text-3xl font-bold text-foreground">Rewards Program</h2>
          <p className="text-muted-foreground mt-1">
            Earn money for waste pickups, recycling, and issue reporting
          </p>
        </div>

        <Tabs defaultValue="rewards" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="rewards">My Rewards</TabsTrigger>
            <TabsTrigger value="referrals">Referrals</TabsTrigger>
          </TabsList>

          <TabsContent value="rewards" className="space-y-6">
            {streak && <StreakCard streak={streak} />}

            <WalletCards
              points={rewards?.points || 0}
              totalEarned={rewards?.total_earned || 0}
              totalRedeemed={rewards?.total_redeemed || 0}
              pointsToNaira={pointsToNaira}
              onWithdraw={handleWithdraw}
            />

            <AvailableRewards
              userPoints={rewards?.points || 0}
              pointsToNaira={pointsToNaira}
              onRedeem={handleRedeem}
            />

            <TransactionHistory transactions={transactions} pointsToNaira={pointsToNaira} />
          </TabsContent>

          <TabsContent value="referrals">
            <ReferralSection />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default Rewards;
