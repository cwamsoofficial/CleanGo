import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, Medal, Award, Star, Flame, Crown, Zap, Sparkles } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface LeaderboardEntry {
  user_id: string;
  name: string;
  total_earned: number;
  rank: number;
  completed_pickups: number;
}

interface Achievement {
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  label: string;
}

export default function Leaderboard() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUserId(user?.id || null);

      // Check if current user is admin
      if (user) {
        const { data: currentUserRole } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .maybeSingle();
        
        setIsAdmin(currentUserRole?.role === 'admin');
      }

      // Fetch top users by total earned points
      const { data: rewardsData, error: rewardsError } = await supabase
        .from('rewards')
        .select('user_id, total_earned')
        .order('total_earned', { ascending: false })
        .limit(50);

      if (rewardsError) throw rewardsError;

      if (!rewardsData || rewardsData.length === 0) {
        setLeaderboard([]);
        setLoading(false);
        return;
      }

      // Fetch roles to filter out admins
      const userIds = rewardsData.map(r => r.user_id);
      const { data: rolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role')
        .in('user_id', userIds);

      if (rolesError) throw rolesError;

      // Filter out admin and collector users (only show citizens and companies)
      const eligibleRewards = rewardsData.filter(reward => {
        const userRole = rolesData?.find(r => r.user_id === reward.user_id);
        return userRole?.role !== 'admin' && userRole?.role !== 'collector';
      });

      if (eligibleRewards.length === 0) {
        setLeaderboard([]);
        setLoading(false);
        return;
      }

      // Fetch profiles for eligible users
      const eligibleUserIds = eligibleRewards.map(r => r.user_id);
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, name')
        .in('id', eligibleUserIds);

      if (profilesError) throw profilesError;

      // Fetch completed pickups count for each user (only as requesters, not as collectors)
      const { data: pickupsData, error: pickupsError } = await supabase
        .from('waste_pickups')
        .select('user_id, status')
        .in('user_id', eligibleUserIds)
        .eq('status', 'collected');

      if (pickupsError) throw pickupsError;

      // Count completed pickups per user
      const pickupCounts: Record<string, number> = {};
      eligibleUserIds.forEach(id => {
        pickupCounts[id] = pickupsData?.filter(p => p.user_id === id).length || 0;
      });

      // Combine data
      const leaderboardData: LeaderboardEntry[] = eligibleRewards.map((reward, index) => {
        const profile = profilesData?.find(p => p.id === reward.user_id);
        return {
          user_id: reward.user_id,
          name: profile?.name || 'Anonymous User',
          total_earned: reward.total_earned,
          rank: index + 1,
          completed_pickups: pickupCounts[reward.user_id] || 0
        };
      });

      setLeaderboard(leaderboardData);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="h-6 w-6 text-yellow-500" />;
    if (rank === 2) return <Medal className="h-6 w-6 text-gray-400" />;
    if (rank === 3) return <Award className="h-6 w-6 text-amber-600" />;
    return null;
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const pointsToNaira = (points: number) => {
    return (points * 10).toLocaleString();
  };

  const getAchievements = (entry: LeaderboardEntry): Achievement[] => {
    const achievements: Achievement[] = [];

    // Community Hero - Top 3 overall
    if (entry.rank <= 3) {
      achievements.push({
        icon: Crown,
        color: "text-yellow-500",
        label: "Community Hero"
      });
    }

    // Rising Star - 500+ points
    if (entry.total_earned >= 500) {
      achievements.push({
        icon: Star,
        color: "text-blue-500",
        label: "Rising Star (500+ points)"
      });
    }

    // On Fire - 1000+ points
    if (entry.total_earned >= 1000) {
      achievements.push({
        icon: Flame,
        color: "text-orange-500",
        label: "On Fire (1000+ points)"
      });
    }

    // Eco Champion - 100+ completed pickups
    if (entry.completed_pickups >= 100) {
      achievements.push({
        icon: Sparkles,
        color: "text-green-500",
        label: "Eco Champion (100+ pickups)"
      });
    }

    // Dedicated Collector - 50+ completed pickups
    if (entry.completed_pickups >= 50 && entry.completed_pickups < 100) {
      achievements.push({
        icon: Zap,
        color: "text-purple-500",
        label: "Dedicated Collector (50+ pickups)"
      });
    }

    // Getting Started - 10+ completed pickups
    if (entry.completed_pickups >= 10 && entry.completed_pickups < 50) {
      achievements.push({
        icon: Award,
        color: "text-cyan-500",
        label: "Getting Started (10+ pickups)"
      });
    }

    return achievements;
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Loading leaderboard...</p>
        </div>
      </DashboardLayout>
    );
  }

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
            {/* Top 3 Podium */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {leaderboard.slice(0, 3).map((entry) => (
                <Card 
                  key={entry.user_id}
                  className={`${
                    entry.rank === 1 ? 'border-yellow-500 bg-gradient-to-br from-yellow-50 to-background dark:from-yellow-950/20' :
                    entry.rank === 2 ? 'border-gray-400 bg-gradient-to-br from-gray-50 to-background dark:from-gray-950/20' :
                    'border-amber-600 bg-gradient-to-br from-amber-50 to-background dark:from-amber-950/20'
                  } ${entry.user_id === currentUserId ? 'ring-2 ring-primary' : ''}`}
                >
                  <CardHeader className="text-center">
                    <div className="flex justify-center mb-2">
                      {getRankIcon(entry.rank)}
                    </div>
                    <CardTitle className="text-lg">#{entry.rank}</CardTitle>
                  </CardHeader>
                  <CardContent className="text-center space-y-2">
                    <Avatar className="h-16 w-16 mx-auto">
                      <AvatarFallback className="text-lg bg-primary/10 text-primary">
                        {getInitials(entry.name)}
                      </AvatarFallback>
                    </Avatar>
                    <p className="font-semibold">{entry.name}</p>
                    <TooltipProvider>
                      <div className="flex items-center justify-center gap-1 flex-wrap mb-2">
                        {getAchievements(entry).map((achievement, idx) => {
                          const Icon = achievement.icon;
                          return (
                            <Tooltip key={idx}>
                              <TooltipTrigger>
                                <Icon className={`h-4 w-4 ${achievement.color}`} />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="text-xs">{achievement.label}</p>
                              </TooltipContent>
                            </Tooltip>
                          );
                        })}
                      </div>
                    </TooltipProvider>
                    <p className="text-2xl font-bold text-primary">
                      ₦{pointsToNaira(entry.total_earned)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {entry.total_earned.toLocaleString()} points
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Rest of leaderboard - Only for admins */}
            {isAdmin && leaderboard.length > 3 && (
              <Card>
                <CardHeader>
                  <CardTitle>All Rankings</CardTitle>
                  <CardDescription>Complete community standings</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {leaderboard.slice(3).map((entry) => (
                      <div
                        key={entry.user_id}
                        className={`flex items-center justify-between p-4 rounded-lg border ${
                          entry.user_id === currentUserId 
                            ? 'bg-primary/5 border-primary' 
                            : 'bg-card border-border hover:bg-accent/50'
                        } transition-colors`}
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-8 text-center font-bold text-muted-foreground">
                            #{entry.rank}
                          </div>
                          <Avatar className="h-10 w-10">
                            <AvatarFallback className="bg-primary/10 text-primary">
                              {getInitials(entry.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-medium">
                                {entry.name}
                              </p>
                              {entry.user_id === currentUserId && (
                                <span className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded">
                                  You
                                </span>
                              )}
                              <TooltipProvider>
                                <div className="flex items-center gap-1">
                                  {getAchievements(entry).map((achievement, idx) => {
                                    const Icon = achievement.icon;
                                    return (
                                      <Tooltip key={idx}>
                                        <TooltipTrigger>
                                          <Icon className={`h-3.5 w-3.5 ${achievement.color}`} />
                                        </TooltipTrigger>
                                        <TooltipContent>
                                          <p className="text-xs">{achievement.label}</p>
                                        </TooltipContent>
                                      </Tooltip>
                                    );
                                  })}
                                </div>
                              </TooltipProvider>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {entry.total_earned.toLocaleString()} points • {entry.completed_pickups} pickups
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-primary">
                            ₦{pointsToNaira(entry.total_earned)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
