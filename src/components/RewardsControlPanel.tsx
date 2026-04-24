import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { Award, RotateCcw, Trash2, ShieldCheck, ShieldOff, History, AlertTriangle } from "lucide-react";

const CONFIRM_COOLDOWN_SECONDS = 5;

interface DangerConfirmDialogProps {
  trigger: React.ReactNode;
  title: string;
  description: string;
  confirmPhrase: string;
  confirmButtonLabel: string;
  onConfirm: () => Promise<void> | void;
  disabled?: boolean;
}

const DangerConfirmDialog = ({
  trigger,
  title,
  description,
  confirmPhrase,
  confirmButtonLabel,
  onConfirm,
  disabled,
}: DangerConfirmDialogProps) => {
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState("");
  const [cooldown, setCooldown] = useState(CONFIRM_COOLDOWN_SECONDS);
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    if (open) {
      setTyped("");
      setCooldown(CONFIRM_COOLDOWN_SECONDS);
      intervalRef.current = window.setInterval(() => {
        setCooldown((c) => {
          if (c <= 1) {
            if (intervalRef.current) window.clearInterval(intervalRef.current);
            return 0;
          }
          return c - 1;
        });
      }, 1000);
    }
    return () => {
      if (intervalRef.current) window.clearInterval(intervalRef.current);
    };
  }, [open]);

  const phraseOk = typed.trim().toUpperCase() === confirmPhrase.toUpperCase();
  const ready = phraseOk && cooldown === 0;

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild disabled={disabled}>{trigger}</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-destructive" />
            {title}
          </AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-3 py-2">
          <div className="rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm">
            This action is <span className="font-semibold">irreversible</span>. To proceed,
            type <span className="font-mono font-semibold">{confirmPhrase}</span> below.
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="confirm-phrase">Confirmation</Label>
            <Input
              id="confirm-phrase"
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              placeholder={confirmPhrase}
              autoComplete="off"
              autoFocus
            />
          </div>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            disabled={!ready}
            onClick={async (e) => {
              if (!ready) {
                e.preventDefault();
                return;
              }
              await onConfirm();
              setOpen(false);
            }}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {cooldown > 0 ? `${confirmButtonLabel} (${cooldown}s)` : confirmButtonLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

interface AuditEntry {
  id: string;
  admin_email: string | null;
  action: string;
  details: Record<string, any> | null;
  created_at: string;
}

interface Stats {
  totalPoints: number;
  totalEarned: number;
  totalRedeemed: number;
  totalPickups: number;
  rewardsEnabled: boolean;
  lastResetAt: string | null;
  lastResetBy: string | null;
}

const ACTION_LABEL: Record<string, { label: string; className: string }> = {
  rewards_enabled: { label: "Rewards Enabled", className: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300" },
  rewards_disabled: { label: "Rewards Disabled", className: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300" },
  rewards_reset: { label: "Rewards Reset", className: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300" },
  pickups_reset: { label: "Pickups Reset", className: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300" },
};

const RewardsControlPanel = () => {
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);
  const [stats, setStats] = useState<Stats>({
    totalPoints: 0,
    totalEarned: 0,
    totalRedeemed: 0,
    totalPickups: 0,
    rewardsEnabled: false,
    lastResetAt: null,
    lastResetBy: null,
  });
  const [auditLog, setAuditLog] = useState<AuditEntry[]>([]);

  const load = async () => {
    setLoading(true);
    try {
      const [rewardsRes, pickupsRes, settingsRes, auditRes] = await Promise.all([
        supabase.from("rewards").select("points, total_earned, total_redeemed"),
        supabase.from("waste_pickups").select("id", { count: "exact", head: true }),
        supabase.from("system_settings").select("value, updated_at").eq("key", "rewards_enabled").maybeSingle(),
        supabase
          .from("admin_audit_log")
          .select("id, admin_email, action, details, created_at")
          .order("created_at", { ascending: false })
          .limit(50),
      ]);

      const rewards = rewardsRes.data ?? [];
      const totals = rewards.reduce(
        (acc, r: any) => ({
          totalPoints: acc.totalPoints + (r.points ?? 0),
          totalEarned: acc.totalEarned + (r.total_earned ?? 0),
          totalRedeemed: acc.totalRedeemed + (r.total_redeemed ?? 0),
        }),
        { totalPoints: 0, totalEarned: 0, totalRedeemed: 0 }
      );

      const audit = (auditRes.data ?? []) as AuditEntry[];
      const lastReset = audit.find((a) => a.action === "rewards_reset");

      setStats({
        ...totals,
        totalPickups: pickupsRes.count ?? 0,
        rewardsEnabled: !!(settingsRes.data?.value as any)?.enabled,
        lastResetAt: lastReset?.created_at ?? null,
        lastResetBy: lastReset?.admin_email ?? null,
      });
      setAuditLog(audit);
    } catch (err: any) {
      toast.error(err.message ?? "Failed to load reward status");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleToggle = async (enabled: boolean) => {
    setActing(true);
    try {
      const { error } = await supabase.rpc("admin_set_rewards_enabled", { _enabled: enabled });
      if (error) throw error;
      toast.success(enabled ? "Rewards enabled" : "Rewards disabled");
      await load();
    } catch (err: any) {
      toast.error(err.message ?? "Failed to update setting");
    } finally {
      setActing(false);
    }
  };

  const handleResetRewards = async () => {
    setActing(true);
    try {
      const { error } = await supabase.rpc("admin_reset_all_rewards");
      if (error) throw error;
      toast.success("All reward points have been reset");
      await load();
    } catch (err: any) {
      toast.error(err.message ?? "Failed to reset rewards");
    } finally {
      setActing(false);
    }
  };

  const handleResetPickups = async () => {
    setActing(true);
    try {
      const { error } = await supabase.rpc("admin_reset_all_pickups");
      if (error) throw error;
      toast.success("All pickups have been deleted");
      await load();
    } catch (err: any) {
      toast.error(err.message ?? "Failed to reset pickups");
    } finally {
      setActing(false);
    }
  };

  const formatDetails = (details: Record<string, any> | null) => {
    if (!details || Object.keys(details).length === 0) return "—";
    return Object.entries(details)
      .map(([k, v]) => `${k}: ${v}`)
      .join(", ");
  };

  return (
    <div className="space-y-6">
      {/* Status header */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Award className="w-5 h-5" /> Rewards Control
              </CardTitle>
              <CardDescription>
                Enable or disable point awarding and reset reward / pickup data. All actions are logged below.
              </CardDescription>
            </div>
            <div className="flex items-center gap-3">
              {stats.rewardsEnabled ? (
                <Badge className="bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300 gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> Enabled
                </Badge>
              ) : (
                <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 gap-1">
                  <ShieldOff className="w-3.5 h-3.5" /> Disabled
                </Badge>
              )}
              <Switch
                checked={stats.rewardsEnabled}
                disabled={loading || acting}
                onCheckedChange={handleToggle}
                aria-label="Toggle rewards"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Current Points" value={stats.totalPoints} />
            <StatCard label="Total Earned" value={stats.totalEarned} />
            <StatCard label="Total Redeemed" value={stats.totalRedeemed} />
            <StatCard label="Total Pickups" value={stats.totalPickups} />
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="rounded-lg border p-4">
              <p className="text-sm text-muted-foreground">Last reset</p>
              <p className="font-medium mt-1">
                {stats.lastResetAt ? new Date(stats.lastResetAt).toLocaleString() : "Never"}
              </p>
              {stats.lastResetBy && (
                <p className="text-xs text-muted-foreground mt-1">by {stats.lastResetBy}</p>
              )}
            </div>
            <div className="rounded-lg border p-4 flex flex-wrap gap-2">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm" disabled={acting}>
                    <RotateCcw className="w-4 h-4 mr-2" /> Reset Rewards
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Reset all reward data?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will set all users' points to zero, clear streaks, and delete all reward transactions. This cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleResetRewards}>Reset Rewards</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="sm" disabled={acting}>
                    <Trash2 className="w-4 h-4 mr-2" /> Reset Pickups
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete all pickups?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete every pickup record in the system. This cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleResetPickups}>Delete Pickups</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Audit log */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="w-5 h-5" /> Audit Log
          </CardTitle>
          <CardDescription>Recent admin actions affecting rewards and pickups.</CardDescription>
        </CardHeader>
        <CardContent>
          {auditLog.length === 0 ? (
            <p className="text-sm text-muted-foreground">No actions recorded yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>When</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Admin</TableHead>
                    <TableHead>Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {auditLog.map((entry) => {
                    const meta = ACTION_LABEL[entry.action] ?? {
                      label: entry.action,
                      className: "bg-muted text-foreground",
                    };
                    return (
                      <TableRow key={entry.id}>
                        <TableCell className="whitespace-nowrap">
                          {new Date(entry.created_at).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <Badge className={meta.className}>{meta.label}</Badge>
                        </TableCell>
                        <TableCell className="text-sm">{entry.admin_email ?? "—"}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {formatDetails(entry.details)}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

const StatCard = ({ label, value }: { label: string; value: number }) => (
  <div className="rounded-lg border p-4">
    <p className="text-sm text-muted-foreground">{label}</p>
    <p className="text-2xl font-bold mt-1">{value.toLocaleString()}</p>
  </div>
);

export default RewardsControlPanel;
