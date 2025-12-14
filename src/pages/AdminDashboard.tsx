import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { getUserRole } from "@/lib/supabase";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Users, Trash2, AlertCircle, Award, TrendingUp } from "lucide-react";
import SecurityDashboard from "@/components/SecurityDashboard";
import UserManagement from "@/components/UserManagement";

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  created_at: string;
}

interface SystemStats {
  totalUsers: number;
  totalPickups: number;
  totalIssues: number;
  totalRewards: number;
}

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<SystemStats>({
    totalUsers: 0,
    totalPickups: 0,
    totalIssues: 0,
    totalRewards: 0,
  });

  useEffect(() => {
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      navigate("/auth");
      return;
    }

    const role = await getUserRole(user.id);
    if (role !== "admin") {
      toast.error("Access denied. Admin only.");
      navigate("/dashboard");
      return;
    }

    fetchAdminData();
  };

  const fetchAdminData = async () => {
    setLoading(true);
    
    try {
      // Fetch all users with their profiles and roles
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("id, name, created_at");
      
      const { data: rolesData } = await supabase
        .from("user_roles")
        .select("user_id, role");

      // Combine data
      const usersWithRoles = profilesData?.map(profile => {
        const roleInfo = rolesData?.find(r => r.user_id === profile.id);
        return {
          id: profile.id,
          email: profile.id.slice(0, 8),
          name: profile.name,
          role: roleInfo?.role || "citizen",
          created_at: profile.created_at,
        };
      }) || [];

      setUsers(usersWithRoles);

      // Fetch system stats
      const { count: pickupCount } = await supabase
        .from("waste_pickups")
        .select("*", { count: "exact", head: true });

      const { count: issueCount } = await supabase
        .from("issue_reports")
        .select("*", { count: "exact", head: true });

      const { data: rewardsData } = await supabase
        .from("rewards")
        .select("points");

      const totalRewardsPoints = rewardsData?.reduce((sum, r) => sum + r.points, 0) || 0;

      setStats({
        totalUsers: usersWithRoles.length,
        totalPickups: pickupCount || 0,
        totalIssues: issueCount || 0,
        totalRewards: totalRewardsPoints,
      });
    } catch (error) {
      console.error("Error fetching admin data:", error);
      toast.error("Failed to load admin data");
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      // Delete existing role
      await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", userId);

      // Insert new role
      const { error } = await supabase
        .from("user_roles")
        .insert([{ user_id: userId, role: newRole as any }]);

      if (error) throw error;

      toast.success("User role updated successfully");
      fetchAdminData();
    } catch (error) {
      console.error("Error updating role:", error);
      toast.error("Failed to update user role");
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "admin": return "bg-red-500";
      case "collector": return "bg-blue-500";
      case "company": return "bg-purple-500";
      default: return "bg-gray-500";
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading admin dashboard...</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Admin Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Manage users, monitor system activity, and oversee operations
          </p>
        </div>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="users">User Management</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-8 mt-6">

        {/* System Statistics */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalUsers}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Pickups</CardTitle>
              <Trash2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalPickups}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Issues</CardTitle>
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalIssues}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Reward Points</CardTitle>
              <Award className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalRewards}</div>
            </CardContent>
          </Card>
        </div>

        {/* User Management */}
        <Card>
          <CardHeader>
            <CardTitle>User Management</CardTitle>
            <CardDescription>
              View and manage user roles and permissions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Badge className={getRoleBadgeColor(user.role)}>
                        {user.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(user.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Select
                        value={user.role}
                        onValueChange={(value) => handleRoleChange(user.id, value)}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="citizen">Citizen</SelectItem>
                          <SelectItem value="company">Company</SelectItem>
                          <SelectItem value="collector">Collector</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
          </TabsContent>

          <TabsContent value="users" className="space-y-8 mt-6">
            <UserManagement />
          </TabsContent>

          <TabsContent value="security" className="space-y-8 mt-6">
            <SecurityDashboard />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default AdminDashboard;
