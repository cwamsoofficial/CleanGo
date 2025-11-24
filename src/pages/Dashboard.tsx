import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getUserRole, type UserRole } from "@/lib/supabase";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Package, AlertCircle, CheckCircle, Clock, TrendingUp, Plus, FileText } from "lucide-react";
import { RequestPickupDialog } from "@/components/RequestPickupDialog";
import { RecentIssues } from "@/components/RecentIssues";
import { useNavigate } from "react-router-dom";

const Dashboard = () => {
  const navigate = useNavigate();
  const [role, setRole] = useState<UserRole | null>(null);
  const [stats, setStats] = useState({
    totalPickups: 0,
    pendingPickups: 0,
    completedPickups: 0,
    issues: 0,
    points: 0,
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const userRole = await getUserRole(user.id);
      setRole(userRole);

      // Fetch pickups data
      const { data: pickups } = await supabase
        .from("waste_pickups")
        .select("*")
        .eq(userRole === "citizen" || userRole === "company" ? "user_id" : "collector_id", user.id);

      // Fetch issues data
      const { data: issues } = await supabase
        .from("issue_reports")
        .select("*")
        .eq(userRole === "collector" ? "assigned_collector_id" : "reporter_id", user.id);

      // Fetch rewards data
      const { data: rewards } = await supabase
        .from("rewards")
        .select("points")
        .eq("user_id", user.id)
        .single();

      setStats({
        totalPickups: pickups?.length || 0,
        pendingPickups: pickups?.filter((p) => p.status === "pending").length || 0,
        completedPickups: pickups?.filter((p) => p.status === "collected").length || 0,
        issues: issues?.length || 0,
        points: rewards?.points || 0,
      });
    };

    fetchDashboardData();
  }, []);

  const getStatsCards = () => {
    if (role === "admin") {
      return (
        <>
          <StatsCard
            title="Total Pickups"
            value={stats.totalPickups}
            icon={Package}
            description="All waste collections"
          />
          <StatsCard
            title="Pending Issues"
            value={stats.issues}
            icon={AlertCircle}
            description="Awaiting resolution"
          />
          <StatsCard
            title="Completed Today"
            value={stats.completedPickups}
            icon={CheckCircle}
            description="Successfully collected"
          />
          <StatsCard
            title="System Health"
            value="98%"
            icon={TrendingUp}
            description="Overall efficiency"
          />
        </>
      );
    }

    if (role === "collector") {
      return (
        <>
          <StatsCard
            title="Assigned Pickups"
            value={stats.totalPickups}
            icon={Package}
            description="Total assignments"
          />
          <StatsCard
            title="Pending"
            value={stats.pendingPickups}
            icon={Clock}
            description="Awaiting collection"
          />
          <StatsCard
            title="Completed"
            value={stats.completedPickups}
            icon={CheckCircle}
            description="Successfully done"
          />
          <StatsCard
            title="Issues"
            value={stats.issues}
            icon={AlertCircle}
            description="To resolve"
          />
        </>
      );
    }

    // Citizen or Company
    return (
      <>
        <StatsCard
          title="My Pickups"
          value={stats.totalPickups}
          icon={Package}
          description="Total scheduled"
        />
        <StatsCard
          title="Pending"
          value={stats.pendingPickups}
          icon={Clock}
          description="Awaiting collection"
        />
        <StatsCard
          title="Completed"
          value={stats.completedPickups}
          icon={CheckCircle}
          description="Successfully collected"
        />
        <StatsCard
          title="Reward Points"
          value={stats.points}
          icon={TrendingUp}
          description="Total earned"
        />
      </>
    );
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Dashboard Overview</h2>
          <p className="text-muted-foreground mt-1">
            Welcome to your {role} dashboard. Here's your activity summary.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">{getStatsCards()}</div>

        <div className="grid gap-4 md:grid-cols-2">
          {(role === "citizen" || role === "company") && <RecentIssues />}
          
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Your latest waste management activities</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {stats.totalPickups > 0
                  ? "Check the sidebar for detailed pickup and issue information."
                  : "No recent activity. Start by scheduling a pickup or reporting an issue."}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Commonly used features</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {(role === "citizen" || role === "company") && (
                <>
                  <RequestPickupDialog />
                  <Button 
                    variant="outline" 
                    className="w-full gap-2"
                    onClick={() => navigate("/report-issue")}
                  >
                    <FileText className="w-4 h-4" />
                    Report Issue
                  </Button>
                </>
              )}
              {(role === "collector" || role === "admin") && (
                <Button 
                  variant="outline" 
                  className="w-full gap-2"
                  onClick={() => navigate("/dashboard/pickups")}
                >
                  <Package className="w-4 h-4" />
                  View Pickups
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: any;
  description: string;
}

const StatsCard = ({ title, value, icon: Icon, description }: StatsCardProps) => {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
};

export default Dashboard;
