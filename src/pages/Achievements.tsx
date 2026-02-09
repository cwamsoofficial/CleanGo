import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trophy, Star, Flame, Crown, Zap, Award, Sparkles, Lock, ArrowRight } from "lucide-react";
import { useSubscription } from "@/contexts/SubscriptionContext";

interface UserStats {
  rank: number;
  total_earned: number;
  completed_pickups: number;
}

interface Achievement {
  id: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  label: string;
  description: string;
  requirement: number;
  type: 'rank' | 'points' | 'pickups';
  unlocked: boolean;
  progress: number;
}

export default function Achievements() {
  const navigate = useNavigate();
  const { isSubscribed } = useSubscription();
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserStats();
  }, []);

  const fetchUserStats = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch rewards data
      const { data: rewardsData } = await supabase
        .from('rewards')
        .select('total_earned')
        .eq('user_id', user.id)
        .single();

      if (!rewardsData) {
        setUserStats({ rank: 0, total_earned: 0, completed_pickups: 0 });
        setLoading(false);
        return;
      }

      // Fetch all rewards to calculate rank
      const { data: allRewards } = await supabase
        .from('rewards')
        .select('user_id, total_earned')
        .order('total_earned', { ascending: false });

      // Filter out admin users
      const { data: rolesData } = await supabase
        .from('user_roles')
        .select('user_id, role')
        .in('user_id', allRewards?.map(r => r.user_id) || []);

      const nonAdminRewards = allRewards?.filter(reward => {
        const userRole = rolesData?.find(r => r.user_id === reward.user_id);
        return userRole?.role !== 'admin';
      }) || [];

      const rank = nonAdminRewards.findIndex(r => r.user_id === user.id) + 1;

      // Fetch completed pickups
      const { data: pickupsData } = await supabase
        .from('waste_pickups')
        .select('user_id, collector_id, status')
        .eq('status', 'collected')
        .or(`user_id.eq.${user.id},collector_id.eq.${user.id}`);

      const completed_pickups = pickupsData?.length || 0;

      const stats: UserStats = {
        rank: rank || 0,
        total_earned: rewardsData.total_earned,
        completed_pickups
      };

      setUserStats(stats);
      generateAchievements(stats);
    } catch (error) {
      console.error('Error fetching user stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateAchievements = (stats: UserStats) => {
    const achievementsList: Achievement[] = [
      {
        id: 'community_hero',
        icon: Crown,
        color: 'text-yellow-500',
        label: 'Community Hero',
        description: 'Reach top 3 in the leaderboard',
        requirement: 3,
        type: 'rank',
        unlocked: stats.rank > 0 && stats.rank <= 3,
        progress: stats.rank > 0 ? Math.min((3 / stats.rank) * 100, 100) : 0
      },
      {
        id: 'rising_star',
        icon: Star,
        color: 'text-blue-500',
        label: 'Rising Star',
        description: 'Earn 500+ points',
        requirement: 500,
        type: 'points',
        unlocked: stats.total_earned >= 500,
        progress: Math.min((stats.total_earned / 500) * 100, 100)
      },
      {
        id: 'on_fire',
        icon: Flame,
        color: 'text-orange-500',
        label: 'On Fire',
        description: 'Earn 1000+ points',
        requirement: 1000,
        type: 'points',
        unlocked: stats.total_earned >= 1000,
        progress: Math.min((stats.total_earned / 1000) * 100, 100)
      },
      {
        id: 'getting_started',
        icon: Award,
        color: 'text-cyan-500',
        label: 'Getting Started',
        description: 'Complete 10+ pickups',
        requirement: 10,
        type: 'pickups',
        unlocked: stats.completed_pickups >= 10,
        progress: Math.min((stats.completed_pickups / 10) * 100, 100)
      },
      {
        id: 'dedicated_collector',
        icon: Zap,
        color: 'text-purple-500',
        label: 'Dedicated Collector',
        description: 'Complete 50+ pickups',
        requirement: 50,
        type: 'pickups',
        unlocked: stats.completed_pickups >= 50,
        progress: Math.min((stats.completed_pickups / 50) * 100, 100)
      },
      {
        id: 'eco_champion',
        icon: Sparkles,
        color: 'text-green-500',
        label: 'Eco Champion',
        description: 'Complete 100+ pickups',
        requirement: 100,
        type: 'pickups',
        unlocked: stats.completed_pickups >= 100,
        progress: Math.min((stats.completed_pickups / 100) * 100, 100)
      }
    ];

    setAchievements(achievementsList);
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'rank': return 'Leaderboard Position';
      case 'points': return 'Points Earned';
      case 'pickups': return 'Pickups Completed';
      default: return '';
    }
  };

  const getProgressText = (achievement: Achievement, stats: UserStats) => {
    if (achievement.unlocked) return 'Unlocked!';
    
    switch (achievement.type) {
      case 'rank':
        return stats.rank > 0 ? `Current rank: #${stats.rank}` : 'Not ranked yet';
      case 'points':
        return `${stats.total_earned} / ${achievement.requirement} points`;
      case 'pickups':
        return `${stats.completed_pickups} / ${achievement.requirement} pickups`;
      default:
        return '';
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
                  Unlock Achievements
                  <Sparkles className="h-5 w-5 text-primary" />
                </h2>
                <p className="text-muted-foreground">
                  Upgrade to Premium to track your progress and unlock exclusive badges!
                </p>
              </div>

              <div className="flex flex-col gap-3 text-left bg-muted/50 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <div className="h-3 w-3 rounded-full bg-primary" />
                  <span className="text-sm">
                    <span className="font-semibold">Premium Basic:</span> Track achievements & progress
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-3 w-3 rounded-full bg-primary" />
                  <span className="text-sm">
                    <span className="font-semibold">Premium Pro:</span> Exclusive badges + bonus rewards
                  </span>
                </div>
              </div>

              <Button onClick={() => navigate("/dashboard/billing")} size="lg" className="gap-2 w-full sm:w-auto">
                Upgrade Now to Unlock Achievements
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
          <p className="text-muted-foreground">Loading achievements...</p>
        </div>
      </DashboardLayout>
    );
  }

  const unlockedCount = achievements.filter(a => a.unlocked).length;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Achievements</h1>
          <p className="text-muted-foreground mt-2">
            Track your progress and unlock badges
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-primary" />
              Your Progress
            </CardTitle>
            <CardDescription>
              You've unlocked {unlockedCount} out of {achievements.length} achievements
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-card border border-border rounded-lg p-4">
                <p className="text-sm text-muted-foreground">Leaderboard Rank</p>
                <p className="text-2xl font-bold text-foreground">
                  {userStats?.rank ? `#${userStats.rank}` : 'Unranked'}
                </p>
              </div>
              <div className="bg-card border border-border rounded-lg p-4">
                <p className="text-sm text-muted-foreground">Total Points</p>
                <p className="text-2xl font-bold text-foreground">
                  {userStats?.total_earned.toLocaleString() || 0}
                </p>
              </div>
              <div className="bg-card border border-border rounded-lg p-4">
                <p className="text-sm text-muted-foreground">Pickups Completed</p>
                <p className="text-2xl font-bold text-foreground">
                  {userStats?.completed_pickups || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {achievements.map((achievement) => {
            const Icon = achievement.icon;
            return (
              <Card 
                key={achievement.id}
                className={achievement.unlocked ? 'border-primary bg-primary/5' : ''}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-3 rounded-full ${achievement.unlocked ? 'bg-primary/10' : 'bg-muted'}`}>
                        {achievement.unlocked ? (
                          <Icon className={`h-6 w-6 ${achievement.color}`} />
                        ) : (
                          <Lock className="h-6 w-6 text-muted-foreground" />
                        )}
                      </div>
                      <div>
                        <CardTitle className="text-lg">{achievement.label}</CardTitle>
                        <Badge variant={achievement.unlocked ? "default" : "secondary"} className="mt-1">
                          {getTypeLabel(achievement.type)}
                        </Badge>
                      </div>
                    </div>
                    {achievement.unlocked && (
                      <Badge className="bg-primary">Unlocked</Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    {achievement.description}
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="font-medium">
                        {userStats && getProgressText(achievement, userStats)}
                      </span>
                    </div>
                    <Progress 
                      value={achievement.progress} 
                      className="h-2"
                    />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </DashboardLayout>
  );
}
