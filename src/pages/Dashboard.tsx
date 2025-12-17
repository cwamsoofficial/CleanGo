import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getUserRole, type UserRole } from "@/lib/supabase";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Package, AlertCircle, CheckCircle, Clock, TrendingUp, FileText, MapPin, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { RequestPickupDialog } from "@/components/RequestPickupDialog";
import { RecentIssues } from "@/components/RecentIssues";
import { useNavigate } from "react-router-dom";
import { OnboardingTour, useOnboarding } from "@/components/OnboardingTour";
import { InteractiveTour } from "@/components/InteractiveTour";
import { format } from "date-fns";

interface Activity {
  id: string;
  type: "pickup" | "issue";
  title: string;
  status: string;
  location: string | null;
  date: string;
}

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
  const [recentActivity, setRecentActivity] = useState<Activity[]>([]);
  
  const { showOnboarding, hasChecked, completeOnboarding, skipOnboarding } = useOnboarding();

  useEffect(() => {
    const fetchDashboardData = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const userRole = await getUserRole(user.id);
      setRole(userRole);

      // For admins, fetch all data without filtering by user
      if (userRole === "admin") {
        const { data: allPickups } = await supabase
          .from("waste_pickups")
          .select("*");

        const { data: allIssues } = await supabase
          .from("issue_reports")
          .select("*");

        // Get today's date for completed today count
        const today = new Date().toISOString().split('T')[0];

        setStats({
          totalPickups: allPickups?.length || 0,
          pendingPickups: allIssues?.filter((i) => i.status === "pending").length || 0,
          completedPickups: allPickups?.filter((p) => p.status === "collected" && p.completed_at?.startsWith(today)).length || 0,
          issues: allIssues?.length || 0,
          points: 0,
        });
        return;
      }

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

      // Build recent activity from pickups and issues
      const activities: Activity[] = [];
      
      pickups?.slice(0, 3).forEach((p) => {
        activities.push({
          id: p.id,
          type: "pickup",
          title: `Waste Pickup - ${p.status}`,
          status: p.status,
          location: p.location,
          date: p.created_at,
        });
      });
      
      issues?.slice(0, 3).forEach((i) => {
        activities.push({
          id: i.id,
          type: "issue",
          title: i.title,
          status: i.status,
          location: i.location,
          date: i.created_at,
        });
      });
      
      // Sort by date and take top 5
      activities.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setRecentActivity(activities.slice(0, 5));
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
            title="Total Issues"
            value={stats.issues}
            icon={AlertCircle}
            description="All reported issues"
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

  // Show onboarding for citizens, companies, and collectors (not admins)
  const shouldShowOnboarding = hasChecked && showOnboarding && (role === "citizen" || role === "company" || role === "collector");

  return (
    <DashboardLayout>
      {shouldShowOnboarding && (
        <InteractiveTour 
          onComplete={completeOnboarding} 
          onSkip={skipOnboarding}
          role={role as "citizen" | "company" | "collector"}
        />
      )}
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Dashboard Overview</h2>
          <p className="text-muted-foreground mt-1">
            Welcome to your {role} dashboard. Here's your activity summary.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4" data-tour="dashboard-stats">{getStatsCards()}</div>

        <div className="grid gap-4 md:grid-cols-2">
          {(role === "citizen" || role === "company") && <RecentIssues />}
          
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Your latest waste management activities</CardDescription>
            </CardHeader>
            <CardContent>
              {recentActivity.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No recent activity. Start by scheduling a pickup or reporting an issue.
                </p>
              ) : (
                <div className="space-y-3">
                  {recentActivity.map((activity) => (
                    <div 
                      key={activity.id} 
                      className="flex items-start gap-3 p-2 rounded-lg border bg-card cursor-pointer hover:bg-accent/50 transition-colors"
                      onClick={() => navigate(activity.type === "pickup" ? "/dashboard/pickups" : "/dashboard/issues")}
                    >
                      {activity.type === "pickup" ? (
                        <Package className="w-4 h-4 text-primary mt-0.5" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-destructive mt-0.5" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{activity.title}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          {activity.location && (
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {activity.location}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {format(new Date(activity.date), "MMM d")}
                          </span>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-xs shrink-0">
                        {activity.status.replace("_", " ")}
                      </Badge>
                    </div>
                  ))}
                  <Button 
                    variant="link" 
                    className="w-full text-sm text-muted-foreground hover:text-primary p-0 h-auto mt-2"
                    onClick={() => navigate("/dashboard/activity")}
                  >
                    View All Activity →
                  </Button>
                </div>
              )}
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
                  <div data-tour="request-pickup">
                    <RequestPickupDialog />
                  </div>
                  <Button 
                    variant="outline" 
                    className="w-full gap-2"
                    onClick={() => navigate("/dashboard/report-issue")}
                    data-tour="report-issue"
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
