import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Trophy, Medal, Award, Star, Flame, Crown, Zap, Sparkles,
  ArrowRight, Loader2,
} from "lucide-react";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { toast } from "sonner";

interface LeaderboardEntry {
  user_id: string;
  name: string;
  total_earned: number;
  points: number;
  pickups_completed: number;
  rank: number;
}

interface AchievementBadge {
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  label: string;
}

const getAchievements = (entry: LeaderboardEntry): AchievementBadge[] => {
  const badges: AchievementBadge[] = [];
  if (entry.rank <= 3) badges.push({ icon: Crown, color: "text-yellow-500", label: "Community Hero" });
  if (entry.total_earned >= 1000) badges.push({ icon: Flame, color: "text-orange-500", label: "On Fire (1000+ pts)" });
  else if (entry.total_earned >= 500) badges.push({ icon: Star, color: "text-blue-500", label: "Rising Star (500+ pts)" });
  if (entry.pickups_completed >= 100) badges.push({ icon: Sparkles, color: "text-green-500", label: "Eco Champion (100+ pickups)" });
  else if (entry.pickups_completed >= 50) badges.push({ icon: Zap, color: "text-purple-500", label: "Dedicated (50+ pickups)" });
  else if (entry.pickups_completed >= 10) badges.push({ icon: Award, color: "text-cyan-500", label: "Getting Started (10+ pickups)" });
  return badges;
};

const getInitials = (name: string) =>
  name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

const pointsToNaira = (points: number) => (points * 20).toLocaleString();

const getRankIcon = (rank: number) => {
  if (rank === 1) return <Trophy className="h-6 w-6 text-yellow-500" />;
  if (rank === 2) return <Medal className="h-6 w-6 text-muted-foreground" />;
  if (rank === 3) return <Award className="h-6 w-6 text-amber-600" />;
  return null;
};

function AchievementBadges({ badges }: { badges: AchievementBadge[] }) {
  if (badges.length === 0) return null;
  return (
    <TooltipProvider>
      <div className="flex items-center gap-1 flex-wrap">
        {badges.map((b, i) => {
          const Icon = b.icon;
          return (
            <Tooltip key={i}>
              <TooltipTrigger><Icon className={`h-4 w-4 ${b.color}`} /></TooltipTrigger>
              <TooltipContent><p className="text-xs">{b.label}</p></TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    </TooltipProvider>
  );
}

function TopThreeCards({
  entries,
  currentUserId,
}: {
  entries: LeaderboardEntry[];
  currentUserId: string | null;
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {entries.map((entry) => (
        <Card
          key={entry.user_id}
          className={`${
            entry.rank === 1
              ? "border-yellow-500 bg-gradient-to-br from-yellow-50 to-background dark:from-yellow-950/20"
              : entry.rank === 2
              ? "border-muted-foreground/30 bg-gradient-to-br from-muted/50 to-background"
              : "border-amber-600 bg-gradient-to-br from-amber-50 to-background dark:from-amber-950/20"
          } ${entry.user_id === currentUserId ? "ring-2 ring-primary" : ""}`}
        >
          <CardHeader className="text-center pb-2">
            <div className="flex justify-center mb-1">{getRankIcon(entry.rank)}</div>
            <CardTitle className="text-lg">#{entry.rank}</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-2">
            <Avatar className="h-16 w-16 mx-auto">
              <AvatarFallback className="text-lg bg-primary/10 text-primary">
                {getInitials(entry.name)}
              </AvatarFallback>
            </Avatar>
            <p className="font-semibold">{entry.name}</p>
            <div className="flex justify-center">
              <AchievementBadges badges={getAchievements(entry)} />
            </div>
            <p className="text-2xl font-bold text-primary">₦{pointsToNaira(entry.total_earned)}</p>
            <p className="text-sm text-muted-foreground">
              {entry.total_earned.toLocaleString()} pts • {entry.pickups_completed} pickups
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function RemainingRankings({
  entries,
  currentUserId,
}: {
  entries: LeaderboardEntry[];
  currentUserId: string | null;
}) {
  if (entries.length === 0) return null;
  return (
    <Card>
      <CardHeader>
        <CardTitle>All Rankings</CardTitle>
        <CardDescription>Complete community standings</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {entries.map((entry) => (
            <div
              key={entry.user_id}
              className={`flex items-center justify-between p-4 rounded-lg border transition-colors ${
                entry.user_id === currentUserId
                  ? "bg-primary/5 border-primary"
                  : "bg-card border-border hover:bg-accent/50"
              }`}
            >
              <div className="flex items-center gap-4">
                <div className="w-8 text-center font-bold text-muted-foreground">#{entry.rank}</div>
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {getInitials(entry.name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{entry.name}</p>
                    {entry.user_id === currentUserId && (
                      <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded">You</span>
                    )}
                    <AchievementBadges badges={getAchievements(entry)} />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {entry.total_earned.toLocaleString()} pts • {entry.pickups_completed} pickups
                  </p>
                </div>
              </div>
              <p className="text-lg font-bold text-primary">₦{pointsToNaira(entry.total_earned)}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default function Leaderboard() {
  const navigate = useNavigate();
  const { isSubscribed } = useSubscription();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isSubscribed) fetchLeaderboard();
    else setLoading(false);
  }, [isSubscribed]);

  const fetchLeaderboard = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUserId(user?.id || null);

      if (user) {
        const { data: role } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id)
          .maybeSingle();
        setIsAdmin(role?.role === "admin");
      }

      const { data, error } = await supabase.rpc("get_leaderboard", { limit_count: 50 });
      if (error) throw error;

      const entries: LeaderboardEntry[] = (data || []).map((d: any, i: number) => ({
        user_id: d.user_id,
        name: d.name || "Anonymous User",
        total_earned: d.total_earned,
        points: d.points,
        pickups_completed: d.pickups_completed,
        rank: i + 1,
      }));

      setLeaderboard(entries);
    } catch (err) {
      console.error("Error fetching leaderboard:", err);
      toast.error("Failed to load leaderboard");
    } finally {
      setLoading(false);
    }
  };

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
                  <span className="text-sm"><span className="font-semibold">Premium Basic:</span> View top community rankings</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-3 w-3 rounded-full bg-primary" />
                  <span className="text-sm"><span className="font-semibold">Premium Pro:</span> Full leaderboard access + bonus rewards</span>
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

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  // Non-admin premium users see only top 3
  const visibleTop = leaderboard.slice(0, 3);
  const visibleRest = isAdmin ? leaderboard.slice(3) : [];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Community Leaderboard</h1>
          <p className="text-muted-foreground mt-2">
            Top earners making a difference in waste management
          </p>
        </div>

        {leaderboard.length === 0 ? (
          <Card>
            <CardContent className="flex items-center justify-center h-64">
              <p className="text-muted-foreground">No leaderboard data available yet</p>
            </CardContent>
          </Card>
        ) : (
          <>
            <TopThreeCards entries={visibleTop} currentUserId={currentUserId} />
            <RemainingRankings entries={visibleRest} currentUserId={currentUserId} />
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
