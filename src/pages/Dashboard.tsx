import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getUserRole, type UserRole } from "@/lib/supabase";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Package, AlertCircle, CheckCircle, Clock, TrendingUp, Plus, FileText, CreditCard, Receipt } from "lucide-react";
import { Badge } from "@/components/ui/badge";
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

        {/* Digital Billing & Payments Confirmation - Demo for Collectors */}
        {role === "collector" && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-primary" />
                  Payment Confirmations
                </CardTitle>
                <CardDescription>Confirm received payments from users</CardDescription>
              </div>
              <Badge variant="secondary" className="text-xs">Demo</Badge>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { user: "John Doe", amount: "₦2,500.00", date: "Dec 3, 2025", status: "Pending" },
                  { user: "ABC Company", amount: "₦5,000.00", date: "Dec 2, 2025", status: "Confirmed" },
                  { user: "Mary Johnson", amount: "₦2,500.00", date: "Dec 1, 2025", status: "Confirmed" },
                ].map((payment, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="text-sm font-medium">{payment.user}</p>
                      <p className="text-xs text-muted-foreground">{payment.date}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium">{payment.amount}</p>
                      {payment.status === "Pending" ? (
                        <Button size="sm" variant="default">Confirm</Button>
                      ) : (
                        <Badge variant="default">Confirmed</Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Digital Billing & Payments Activity - Demo for Admins */}
        {role === "admin" && (
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-primary" />
                    Billing Activity Overview
                  </CardTitle>
                  <CardDescription>Monitor all payment activities</CardDescription>
                </div>
                <Badge variant="secondary" className="text-xs">Demo</Badge>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="text-xs text-muted-foreground">Total Revenue</p>
                    <p className="text-xl font-bold text-primary">₦125,000</p>
                  </div>
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="text-xs text-muted-foreground">Pending Payments</p>
                    <p className="text-xl font-bold text-orange-500">₦15,000</p>
                  </div>
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="text-xs text-muted-foreground">This Month</p>
                    <p className="text-xl font-bold">₦45,000</p>
                  </div>
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="text-xs text-muted-foreground">Active Subscribers</p>
                    <p className="text-xl font-bold">48</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Receipt className="h-5 w-5 text-primary" />
                  Recent Transactions
                </CardTitle>
                <CardDescription>Latest payment activities</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { user: "John Doe", type: "Payment", amount: "₦2,500.00", status: "Completed" },
                    { user: "XYZ Corp", type: "Payment", amount: "₦5,000.00", status: "Pending" },
                    { user: "Mary Johnson", type: "Refund", amount: "₦1,000.00", status: "Processed" },
                    { user: "Tech Ltd", type: "Payment", amount: "₦7,500.00", status: "Completed" },
                  ].map((tx, index) => (
                    <div key={index} className="flex items-center justify-between p-2 border rounded-lg">
                      <div>
                        <p className="text-sm font-medium">{tx.user}</p>
                        <p className="text-xs text-muted-foreground">{tx.type}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">{tx.amount}</p>
                        <Badge 
                          variant={tx.status === "Completed" ? "default" : tx.status === "Pending" ? "destructive" : "secondary"}
                          className="text-xs"
                        >
                          {tx.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Digital Billing & Payments - Demo for Citizens/Companies */}
        {(role === "citizen" || role === "company") && (
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-primary" />
                    Digital Billing & Payments
                  </CardTitle>
                  <CardDescription>Manage your waste service bills</CardDescription>
                </div>
                <Badge variant="secondary" className="text-xs">Demo</Badge>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium">Current Balance</p>
                    <p className="text-2xl font-bold text-primary">₦2,500.00</p>
                  </div>
                  <Button size="sm" className="gap-2">
                    <CreditCard className="h-4 w-4" />
                    Pay Now
                  </Button>
                </div>
                
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Payment Methods</p>
                  <div className="flex gap-2">
                    <Badge variant="outline">Bank Transfer</Badge>
                    <Badge variant="outline">Card Payment</Badge>
                    <Badge variant="outline">USSD</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Receipt className="h-5 w-5 text-primary" />
                  Recent Bills
                </CardTitle>
                <CardDescription>Your billing history</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { month: "November 2025", amount: "₦2,500.00", status: "Pending" },
                    { month: "October 2025", amount: "₦2,500.00", status: "Paid" },
                    { month: "September 2025", amount: "₦2,500.00", status: "Paid" },
                  ].map((bill, index) => (
                    <div key={index} className="flex items-center justify-between p-2 border rounded-lg">
                      <div>
                        <p className="text-sm font-medium">{bill.month}</p>
                        <p className="text-xs text-muted-foreground">Waste Collection Service</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">{bill.amount}</p>
                        <Badge 
                          variant={bill.status === "Paid" ? "default" : "destructive"}
                          className="text-xs"
                        >
                          {bill.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
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
