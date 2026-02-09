import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { UserX, UserCheck, Trash2, Search, Shield, Ban, Crown } from "lucide-react";
import { toast } from "sonner";
import { PREMIUM_TIERS, type PremiumTier } from "@/contexts/SubscriptionContext";

interface UserSubscription {
  subscribed: boolean;
  tier: string | null;
  end: string | null;
}

interface UserData {
  id: string;
  email: string;
  name: string;
  role: string;
  banned: boolean;
  banned_at: string | null;
  banned_reason: string | null;
  created_at: string;
  subscription?: UserSubscription;
}

const UserManagement = () => {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [banReason, setBanReason] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [showBanDialog, setShowBanDialog] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);

      // Fetch profiles, roles, and subscription status in parallel
      const [profilesResult, rolesResult, subsResult] = await Promise.all([
        supabase.from("profiles").select("*").order("created_at", { ascending: false }),
        supabase.from("user_roles").select("*"),
        supabase.functions.invoke("admin-check-subscriptions"),
      ]);

      if (profilesResult.error) throw profilesResult.error;
      if (rolesResult.error) throw rolesResult.error;

      const subscriptions: Record<string, UserSubscription> = subsResult.data || {};

      const usersData = profilesResult.data?.map((profile) => {
        const role = rolesResult.data?.find((r) => r.user_id === profile.id);

        return {
          id: profile.id,
          email: profile.id.slice(0, 8),
          name: profile.name,
          role: role?.role || "citizen",
          banned: profile.banned || false,
          banned_at: profile.banned_at,
          banned_reason: profile.banned_reason,
          created_at: profile.created_at,
          subscription: subscriptions[profile.id] || { subscribed: false, tier: null, end: null },
        };
      }) || [];

      setUsers(usersData);
    } catch (error: any) {
      console.error("Error fetching users:", error);
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  const handleBanUser = async (userId: string) => {
    try {
      const { error } = await supabase.rpc("ban_user", {
        _user_id: userId,
        _reason: banReason || "No reason provided",
      });

      if (error) throw error;

      toast.success("User banned successfully");
      setBanReason("");
      setShowBanDialog(false);
      setSelectedUserId(null);
      fetchUsers();
    } catch (error: any) {
      console.error("Error banning user:", error);
      toast.error(error.message || "Failed to ban user");
    }
  };

  const handleUnbanUser = async (userId: string) => {
    try {
      const { error } = await supabase.rpc("unban_user", {
        _user_id: userId,
      });

      if (error) throw error;

      toast.success("User unbanned successfully");
      fetchUsers();
    } catch (error: any) {
      console.error("Error unbanning user:", error);
      toast.error(error.message || "Failed to unban user");
    }
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    try {
      const { error } = await supabase.rpc("delete_user_account", {
        _user_id: userId,
      });

      if (error) throw error;

      toast.success(`User ${userName} deleted successfully`);
      fetchUsers();
    } catch (error: any) {
      console.error("Error deleting user:", error);
      toast.error(error.message || "Failed to delete user");
    }
  };

  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "admin":
        return "default";
      case "collector":
        return "secondary";
      case "company":
        return "outline";
      default:
        return "outline";
    }
  };

  const getPlanLabel = (user: UserData): { label: string; isPremium: boolean } => {
    if (!user.subscription?.subscribed) return { label: "Free", isPremium: false };
    const tier = user.subscription.tier;
    if (tier === PREMIUM_TIERS.basic.priceId || tier === PREMIUM_TIERS.basic.productId) {
      return { label: "Premium Basic", isPremium: true };
    }
    if (tier === PREMIUM_TIERS.pro.priceId || tier === PREMIUM_TIERS.pro.productId) {
      return { label: "Premium Pro", isPremium: true };
    }
    return { label: "Premium", isPremium: true };
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>User Management</CardTitle>
        <CardDescription>
          Manage user accounts, ban/unban users, and delete accounts
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2">
          <Search className="w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, email, or role..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
        </div>

        {loading ? (
          <div className="text-center py-8 text-muted-foreground">
            Loading users...
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No users found
          </div>
        ) : (
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => {
                  const plan = getPlanLabel(user);
                  return (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Badge variant={getRoleBadgeVariant(user.role)}>
                        {user.role === "admin" && <Shield className="w-3 h-3 mr-1" />}
                        {user.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {plan.isPremium ? (
                        <Badge className="gap-1 bg-amber-500 hover:bg-amber-600 text-white border-amber-500">
                          <Crown className="w-3 h-3" />
                          {plan.label}
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="gap-1 text-muted-foreground">
                          {plan.label}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {user.banned ? (
                        <Badge variant="destructive" className="gap-1">
                          <Ban className="w-3 h-3" />
                          Banned
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="gap-1">
                          <UserCheck className="w-3 h-3" />
                          Active
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {new Date(user.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {user.banned ? (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                className="gap-1"
                              >
                                <UserCheck className="w-3 h-3" />
                                Unban
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  Unban User?
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  This will restore access for {user.name}. They
                                  will be able to log in and use the system
                                  again.
                                  {user.banned_reason && (
                                    <div className="mt-2 p-2 bg-muted rounded text-sm">
                                      <strong>Ban reason:</strong>{" "}
                                      {user.banned_reason}
                                    </div>
                                  )}
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleUnbanUser(user.id)}
                                >
                                  Unban User
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        ) : (
                          <>
                            <Dialog
                              open={showBanDialog && selectedUserId === user.id}
                              onOpenChange={(open) => {
                                setShowBanDialog(open);
                                if (!open) {
                                  setSelectedUserId(null);
                                  setBanReason("");
                                }
                              }}
                            >
                              <DialogTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="gap-1"
                                  onClick={() => {
                                    setSelectedUserId(user.id);
                                    setShowBanDialog(true);
                                  }}
                                >
                                  <UserX className="w-3 h-3" />
                                  Ban
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Ban User</DialogTitle>
                                  <DialogDescription>
                                    Ban {user.name} from accessing the system.
                                    They will not be able to log in.
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4 py-4">
                                  <div className="space-y-2">
                                    <Label htmlFor="ban-reason">
                                      Reason for Ban (Optional)
                                    </Label>
                                    <Textarea
                                      id="ban-reason"
                                      placeholder="Enter reason for banning this user..."
                                      value={banReason}
                                      onChange={(e) =>
                                        setBanReason(e.target.value)
                                      }
                                      rows={3}
                                    />
                                  </div>
                                </div>
                                <DialogFooter>
                                  <Button
                                    variant="outline"
                                    onClick={() => {
                                      setShowBanDialog(false);
                                      setSelectedUserId(null);
                                      setBanReason("");
                                    }}
                                  >
                                    Cancel
                                  </Button>
                                  <Button
                                    variant="destructive"
                                    onClick={() => handleBanUser(user.id)}
                                  >
                                    Ban User
                                  </Button>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>
                          </>
                        )}

                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="destructive"
                              size="sm"
                              className="gap-1"
                            >
                              <Trash2 className="w-3 h-3" />
                              Delete
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>
                                Delete User Account?
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                This will permanently delete {user.name}'s
                                account and all associated data including:
                                <ul className="list-disc list-inside mt-2 space-y-1">
                                  <li>Profile information</li>
                                  <li>Waste pickups</li>
                                  <li>Issue reports</li>
                                  <li>Rewards and points</li>
                                  <li>All transaction history</li>
                                </ul>
                                <p className="mt-2 font-bold text-destructive">
                                  This action cannot be undone.
                                </p>
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() =>
                                  handleDeleteUser(user.id, user.name)
                                }
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Delete Account
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
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
  );
};

export default UserManagement;
