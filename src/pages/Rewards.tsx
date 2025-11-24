import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Gift, TrendingUp, History, Flame, Award } from "lucide-react";
import { toast } from "sonner";
import { WithdrawalDialog } from "@/components/WithdrawalDialog";
import { ReferralSection } from "@/components/ReferralSection";

interface RewardData {
  points: number;
  total_earned: number;
  total_redeemed: number;
}

interface Transaction {
  id: string;
  points: number;
  type: string;
  description: string;
  created_at: string;
}

interface StreakData {
  current_streak: number;
  longest_streak: number;
  last_activity_date: string | null;
}

const Rewards = () => {
  const [rewards, setRewards] = useState<RewardData | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [streak, setStreak] = useState<StreakData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRewardsData();
  }, []);

  const fetchRewardsData = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: rewardsData } = await supabase
        .from("rewards")
        .select("*")
        .eq("user_id", user.id)
        .single();

      const { data: transactionsData } = await supabase
        .from("reward_transactions")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(10);

      const { data: streakData } = await supabase
        .from("user_streaks")
        .select("*")
        .eq("user_id", user.id)
        .single();

      setRewards(rewardsData);
      setTransactions(transactionsData || []);
      setStreak(streakData);
    } catch {
      toast.error("Failed to load rewards data");
    } finally {
      setLoading(false);
    }
  };

  // Convert points to Naira (1 point = ₦10)
  const pointsToNaira = (points: number) => points * 10;

  const handleRedeem = async (points: number, description: string) => {
    if (!rewards || rewards.points < points) {
      toast.error("Insufficient balance");
      return;
    }

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase.rpc("redeem_points", {
        _user_id: user.id,
        _points: points,
        _description: description,
      });

      if (error) throw error;

      toast.success(`Redeemed ₦${pointsToNaira(points)} for ${description}`);
      fetchRewardsData();
    } catch {
      toast.error("Failed to redeem");
    }
  };

  const handleWithdraw = async (points: number) => {
    if (!rewards || rewards.points < points) {
      toast.error("Insufficient balance");
      return;
    }

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase.rpc("redeem_points", {
        _user_id: user.id,
        _points: points,
        _description: `Withdrawal: ₦${pointsToNaira(points)}`,
      });

      if (error) throw error;

      toast.success(`Successfully withdrew ₦${pointsToNaira(points)}`);
      fetchRewardsData();
    } catch {
      toast.error("Failed to process withdrawal");
    }
  };

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
            {streak && (
              <Card className="bg-gradient-to-br from-orange-500/10 to-orange-600/5 border-orange-500/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Flame className="h-5 w-5 text-orange-500" />
                    Streak Bonuses
                  </CardTitle>
                  <CardDescription>Keep completing pickups to earn bonus rewards</CardDescription>
                </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <Flame className="h-8 w-8 text-orange-500" />
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <Flame className="h-8 w-8 text-orange-500" />
                        <div>
                          <div className="text-2xl font-bold">{streak.current_streak} days</div>
                          <p className="text-xs text-muted-foreground">Current streak</p>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Award className="h-4 w-4" />
                        <span className="text-sm">{streak.longest_streak} days</span>
                      </div>
                      <p className="text-xs text-muted-foreground">Best streak</p>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Milestone Rewards:</p>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className={`p-2 rounded border ${streak.current_streak >= 3 ? 'bg-green-500/10 border-green-500/20' : 'border-border'}`}>
                        <div className="font-medium">3 days</div>
                        <div className="text-muted-foreground">₦500 bonus</div>
                      </div>
                      <div className={`p-2 rounded border ${streak.current_streak >= 7 ? 'bg-green-500/10 border-green-500/20' : 'border-border'}`}>
                        <div className="font-medium">7 days</div>
                        <div className="text-muted-foreground">₦1,500 bonus</div>
                      </div>
                      <div className={`p-2 rounded border ${streak.current_streak >= 14 ? 'bg-green-500/10 border-green-500/20' : 'border-border'}`}>
                        <div className="font-medium">14 days</div>
                        <div className="text-muted-foreground">₦3,000 bonus</div>
                      </div>
                      <div className={`p-2 rounded border ${streak.current_streak >= 30 ? 'bg-green-500/10 border-green-500/20' : 'border-border'}`}>
                        <div className="font-medium">30 days</div>
                        <div className="text-muted-foreground">₦10,000 bonus</div>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      💰 Earn ₦100 for each pickup + milestone bonuses!
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Wallet Balance</CardTitle>
                  <Gift className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <div className="text-3xl font-bold text-primary">₦{pointsToNaira(rewards?.points || 0).toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground">Available balance</p>
                  </div>
                  <WithdrawalDialog
                    availableBalance={rewards?.points || 0}
                    pointsToNaira={pointsToNaira}
                    onWithdraw={handleWithdraw}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Earned</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">₦{pointsToNaira(rewards?.total_earned || 0).toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">Lifetime earnings</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Redeemed</CardTitle>
                  <History className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">₦{pointsToNaira(rewards?.total_redeemed || 0).toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">Spent on rewards</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Available Rewards</CardTitle>
                <CardDescription>Redeem your points for these exclusive rewards</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <RewardItem
                  title="₦1,000 Airtime Credit"
                  description="Mobile airtime top-up"
                  cost={100}
                  userPoints={rewards?.points || 0}
                  pointsToNaira={pointsToNaira}
                  onRedeem={() => handleRedeem(100, "₦1,000 Airtime Credit")}
                />

                <RewardItem
                  title="₦2,000 Airtime Credit"
                  description="Mobile airtime top-up"
                  cost={200}
                  userPoints={rewards?.points || 0}
                  pointsToNaira={pointsToNaira}
                  onRedeem={() => handleRedeem(200, "₦2,000 Airtime Credit")}
                />

                <RewardItem
                  title="₦5,000 Airtime Credit"
                  description="Mobile airtime top-up"
                  cost={500}
                  userPoints={rewards?.points || 0}
                  pointsToNaira={pointsToNaira}
                  onRedeem={() => handleRedeem(500, "₦5,000 Airtime Credit")}
                />

                <RewardItem
                  title="Community Hero Badge"
                  description="Special recognition in the community"
                  cost={1000}
                  userPoints={rewards?.points || 0}
                  pointsToNaira={pointsToNaira}
                  onRedeem={() => handleRedeem(1000, "Community Hero Badge")}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Transaction History</CardTitle>
                <CardDescription>Your recent points activity</CardDescription>
              </CardHeader>
              <CardContent>
                {transactions.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No transactions yet
                  </p>
                ) : (
                  <div className="space-y-3">
                    {transactions.map((transaction) => (
                      <div
                        key={transaction.id}
                        className="flex items-center justify-between p-3 border border-border rounded-lg"
                      >
                        <div>
                          <p className="font-medium text-sm">{transaction.description}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(transaction.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <Badge
                          variant={transaction.type === "earned" ? "default" : "secondary"}
                        >
                          {transaction.type === "earned" ? "+" : "-"}₦{pointsToNaira(Math.abs(transaction.points)).toLocaleString()}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="referrals">
            <ReferralSection />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

const RewardItem = ({
  title,
  description,
  cost,
  userPoints,
  pointsToNaira,
  onRedeem,
}: {
  title: string;
  description: string;
  cost: number;
  userPoints: number;
  pointsToNaira: (points: number) => number;
  onRedeem: () => void;
}) => (
  <div className="flex items-center justify-between p-4 border border-border rounded-lg">
    <div>
      <h3 className="font-semibold">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
    <div className="flex items-center gap-3">
      <Badge variant="secondary">₦{pointsToNaira(cost).toLocaleString()}</Badge>
      <Button size="sm" onClick={onRedeem} disabled={userPoints < cost}>
        Redeem
      </Button>
    </div>
  </div>
);

export default Rewards;
