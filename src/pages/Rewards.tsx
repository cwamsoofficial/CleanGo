import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Gift, TrendingUp, History } from "lucide-react";
import { toast } from "sonner";

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

const Rewards = () => {
  const [rewards, setRewards] = useState<RewardData | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
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

      setRewards(rewardsData);
      setTransactions(transactionsData || []);
    } catch {
      toast.error("Failed to load rewards data");
    } finally {
      setLoading(false);
    }
  };

  const handleRedeem = async (points: number, description: string) => {
    if (!rewards || rewards.points < points) {
      toast.error("Insufficient points");
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

      toast.success(`Redeemed ${points} points for ${description}`);
      fetchRewardsData();
    } catch {
      toast.error("Failed to redeem points");
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
            Earn points for your contributions and redeem them for rewards
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Available Points</CardTitle>
              <Gift className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">{rewards?.points || 0}</div>
              <p className="text-xs text-muted-foreground">Ready to redeem</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Earned</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{rewards?.total_earned || 0}</div>
              <p className="text-xs text-muted-foreground">Lifetime points</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Redeemed</CardTitle>
              <History className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{rewards?.total_redeemed || 0}</div>
              <p className="text-xs text-muted-foreground">Used for rewards</p>
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
              title="$5 Airtime Credit"
              description="Mobile airtime top-up"
              cost={50}
              userPoints={rewards?.points || 0}
              onRedeem={() => handleRedeem(50, "$5 Airtime Credit")}
            />

            <RewardItem
              title="$10 Airtime Credit"
              description="Mobile airtime top-up"
              cost={90}
              userPoints={rewards?.points || 0}
              onRedeem={() => handleRedeem(90, "$10 Airtime Credit")}
            />

            <RewardItem
              title="Community Hero Badge"
              description="Special recognition in the community"
              cost={100}
              userPoints={rewards?.points || 0}
              onRedeem={() => handleRedeem(100, "Community Hero Badge")}
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
                      {transaction.type === "earned" ? "+" : "-"}
                      {Math.abs(transaction.points)} pts
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

const RewardItem = ({
  title,
  description,
  cost,
  userPoints,
  onRedeem,
}: {
  title: string;
  description: string;
  cost: number;
  userPoints: number;
  onRedeem: () => void;
}) => (
  <div className="flex items-center justify-between p-4 border border-border rounded-lg">
    <div>
      <h3 className="font-semibold">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
    <div className="flex items-center gap-3">
      <Badge variant="secondary">{cost} points</Badge>
      <Button size="sm" onClick={onRedeem} disabled={userPoints < cost}>
        Redeem
      </Button>
    </div>
  </div>
);

export default Rewards;
