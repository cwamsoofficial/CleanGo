import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Flame, Award } from "lucide-react";

interface StreakData {
  current_streak: number;
  longest_streak: number;
  last_activity_date: string | null;
}

interface StreakCardProps {
  streak: StreakData;
}

export const StreakCard = ({ streak }: StreakCardProps) => (
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
        <div className="flex items-center gap-2">
          <Flame className="h-8 w-8 text-orange-500" />
          <div>
            <div className="text-2xl font-bold">{streak.current_streak} days</div>
            <p className="text-xs text-muted-foreground">Current streak</p>
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
          <div
            className={`p-2 rounded border ${
              streak.current_streak >= 14
                ? "bg-green-500/10 border-green-500/20"
                : "border-border"
            }`}
          >
            <div className="font-medium">14 days</div>
            <div className="text-muted-foreground">100 pts (₦1,500)</div>
          </div>
          <div
            className={`p-2 rounded border ${
              streak.current_streak >= 30
                ? "bg-green-500/10 border-green-500/20"
                : "border-border"
            }`}
          >
            <div className="font-medium">30 days</div>
            <div className="text-muted-foreground">200 pts (₦3,000)</div>
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          💰 Basic: 1 pt/pickup · Pro: 3 pts/pickup + milestone bonuses!
        </p>
      </div>
    </CardContent>
  </Card>
);
