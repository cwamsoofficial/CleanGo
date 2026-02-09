import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Gift, TrendingUp, History } from "lucide-react";
import { WithdrawalDialog } from "@/components/WithdrawalDialog";

interface WalletCardsProps {
  points: number;
  totalEarned: number;
  totalRedeemed: number;
  pointsToNaira: (points: number) => number;
  onWithdraw: (points: number) => Promise<void>;
}

export const WalletCards = ({
  points,
  totalEarned,
  totalRedeemed,
  pointsToNaira,
  onWithdraw,
}: WalletCardsProps) => (
  <div className="grid gap-4 md:grid-cols-3">
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Wallet Balance</CardTitle>
        <Gift className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <div className="text-3xl font-bold text-primary">
            ₦{pointsToNaira(points).toLocaleString()}
          </div>
          <p className="text-xs text-muted-foreground">Available balance</p>
        </div>
        <WithdrawalDialog
          availableBalance={points}
          pointsToNaira={pointsToNaira}
          onWithdraw={onWithdraw}
        />
      </CardContent>
    </Card>

    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Total Earned</CardTitle>
        <TrendingUp className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold">
          ₦{pointsToNaira(totalEarned).toLocaleString()}
        </div>
        <p className="text-xs text-muted-foreground">Lifetime earnings</p>
      </CardContent>
    </Card>

    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Total Redeemed</CardTitle>
        <History className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold">
          ₦{pointsToNaira(totalRedeemed).toLocaleString()}
        </div>
        <p className="text-xs text-muted-foreground">Spent on rewards</p>
      </CardContent>
    </Card>
  </div>
);
