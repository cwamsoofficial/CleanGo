import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, Medal, Award } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface LeaderboardEntry {
  user_id: string;
  name: string;
  total_earned: number;
  rank: number;
}

export default function Leaderboard() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUserId(user?.id || null);

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

      // Fetch profiles for these users
      const userIds = rewardsData.map(r => r.user_id);
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, name')
        .in('id', userIds);

      if (profilesError) throw profilesError;

      // Combine data
      const leaderboardData: LeaderboardEntry[] = rewardsData.map((reward, index) => {
        const profile = profilesData?.find(p => p.id === reward.user_id);
        return {
          user_id: reward.user_id,
          name: profile?.name || 'Anonymous User',
          total_earned: reward.total_earned,
          rank: index + 1
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

            {/* Rest of leaderboard */}
            {leaderboard.length > 3 && (
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
                            <p className="font-medium">
                              {entry.name}
                              {entry.user_id === currentUserId && (
                                <span className="ml-2 text-xs bg-primary text-primary-foreground px-2 py-1 rounded">
                                  You
                                </span>
                              )}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {entry.total_earned.toLocaleString()} points
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
