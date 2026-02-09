import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
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

interface StreakData {
  current_streak: number;
  longest_streak: number;
  last_activity_date: string | null;
}

// 1 point = ₦10
const pointsToNaira = (points: number) => points * 10;

export const useRewardsData = () => {
  const [rewards, setRewards] = useState<RewardData | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [streak, setStreak] = useState<StreakData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchRewardsData = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [rewardsRes, transactionsRes, streakRes] = await Promise.all([
        supabase.from("rewards").select("*").eq("user_id", user.id).single(),
        supabase
          .from("reward_transactions")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(10),
        supabase.from("user_streaks").select("*").eq("user_id", user.id).single(),
      ]);

      setRewards(rewardsRes.data);
      setTransactions(transactionsRes.data || []);
      setStreak(streakRes.data);
    } catch {
      toast.error("Failed to load rewards data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRewardsData();
  }, [fetchRewardsData]);

  const handleRedeem = async (points: number, description: string) => {
    if (!rewards || rewards.points < points) {
      toast.error("Insufficient balance");
      return;
    }
    try {
      const { data: { user } } = await supabase.auth.getUser();
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
      const { data: { user } } = await supabase.auth.getUser();
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

  return {
    rewards,
    transactions,
    streak,
    loading,
    pointsToNaira,
    handleRedeem,
    handleWithdraw,
  };
};
