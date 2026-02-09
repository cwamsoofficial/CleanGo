import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface RewardItemProps {
  title: string;
  description: string;
  cost: number;
  userPoints: number;
  pointsToNaira: (points: number) => number;
  onRedeem: () => void;
}

const RewardItem = ({ title, description, cost, userPoints, pointsToNaira, onRedeem }: RewardItemProps) => (
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

interface AvailableRewardsProps {
  userPoints: number;
  pointsToNaira: (points: number) => number;
  onRedeem: (points: number, description: string) => void;
}

const REWARDS = [
  { title: "₦1,000 Airtime Credit", description: "Mobile airtime top-up", cost: 100 },
  { title: "₦2,000 Airtime Credit", description: "Mobile airtime top-up", cost: 200 },
  { title: "₦5,000 Airtime Credit", description: "Mobile airtime top-up", cost: 500 },
  { title: "Community Hero Badge", description: "Special recognition in the community", cost: 1000 },
];

export const AvailableRewards = ({ userPoints, pointsToNaira, onRedeem }: AvailableRewardsProps) => (
  <Card>
    <CardHeader>
      <CardTitle>Available Rewards</CardTitle>
      <CardDescription>Redeem your points for these exclusive rewards</CardDescription>
    </CardHeader>
    <CardContent className="space-y-4">
      {REWARDS.map((reward) => (
        <RewardItem
          key={reward.title}
          {...reward}
          userPoints={userPoints}
          pointsToNaira={pointsToNaira}
          onRedeem={() => onRedeem(reward.cost, reward.title)}
        />
      ))}
    </CardContent>
  </Card>
);
