import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Transaction {
  id: string;
  points: number;
  type: string;
  description: string;
  created_at: string;
}

interface TransactionHistoryProps {
  transactions: Transaction[];
  pointsToNaira: (points: number) => number;
}

export const TransactionHistory = ({ transactions, pointsToNaira }: TransactionHistoryProps) => (
  <Card>
    <CardHeader>
      <CardTitle>Transaction History</CardTitle>
      <CardDescription>Your recent points activity</CardDescription>
    </CardHeader>
    <CardContent>
      {transactions.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">No transactions yet</p>
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
              <Badge variant={transaction.type === "earned" ? "default" : "secondary"}>
                {transaction.type === "earned" ? "+" : "-"}₦
                {pointsToNaira(Math.abs(transaction.points)).toLocaleString()}
              </Badge>
            </div>
          ))}
        </div>
      )}
    </CardContent>
  </Card>
);
