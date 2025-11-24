import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Wallet } from "lucide-react";

interface WithdrawalDialogProps {
  availableBalance: number;
  pointsToNaira: (points: number) => number;
  onWithdraw: (points: number) => Promise<void>;
}

export const WithdrawalDialog = ({
  availableBalance,
  pointsToNaira,
  onWithdraw,
}: WithdrawalDialogProps) => {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);

  const handleWithdraw = async () => {
    const nairaAmount = parseFloat(amount);
    if (isNaN(nairaAmount) || nairaAmount <= 0) {
      return;
    }

    const points = Math.floor(nairaAmount / 10);
    
    setLoading(true);
    try {
      await onWithdraw(points);
      setOpen(false);
      setAmount("");
    } finally {
      setLoading(false);
    }
  };

  const maxWithdrawal = pointsToNaira(availableBalance);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="default" className="w-full">
          <Wallet className="mr-2 h-4 w-4" />
          Withdraw
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Withdraw Balance</DialogTitle>
          <DialogDescription>
            Enter the amount you want to withdraw. Available balance: ₦{maxWithdrawal.toLocaleString()}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="amount">Amount (₦)</Label>
            <Input
              id="amount"
              type="number"
              placeholder="Enter amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min="1000"
              max={maxWithdrawal}
              step="10"
            />
            <p className="text-xs text-muted-foreground">
              Minimum withdrawal: ₦1,000 • Maximum: ₦{maxWithdrawal.toLocaleString()}
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setOpen(false);
              setAmount("");
            }}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            onClick={handleWithdraw}
            disabled={
              loading ||
              !amount ||
              parseFloat(amount) < 1000 ||
              parseFloat(amount) > maxWithdrawal
            }
          >
            {loading ? "Processing..." : "Confirm Withdrawal"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
