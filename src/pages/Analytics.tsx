import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { getUserRole, type UserRole } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Package, CheckCircle, Clock, TrendingUp } from "lucide-react";

interface PickupData {
  id: string;
  status: string;
  created_at: string;
  completed_at: string | null;
  collector_id: string | null;
}

const Analytics = () => {
  const navigate = useNavigate();
  const [role, setRole] = useState<UserRole | null>(null);
  const [userId, setUserId] = useState<string>("");
  const [pickups, setPickups] = useState<PickupData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        navigate("/auth");
        return;
      }

      setUserId(user.id);
      const userRole = await getUserRole(user.id);
      setRole(userRole);

      if (userRole !== "collector" && userRole !== "admin") {
        navigate("/dashboard");
        return;
      }

      let query = supabase.from("waste_pickups").select("*");

      if (userRole === "collector") {
        query = query.eq("collector_id", user.id);
      }

      const { data, error } = await query;

      if (error) {
        console.error("Error fetching pickups:", error);
      } else {
        setPickups(data || []);
      }

      setLoading(false);
    };

    fetchData();
  }, [navigate]);

  const calculateStats = () => {
    const total = pickups.length;
    const completed = pickups.filter((p) => p.status === "collected").length;
    const inProgress = pickups.filter((p) => p.status === "in_progress").length;
    const pending = pickups.filter((p) => p.status === "pending").length;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    return { total, completed, inProgress, pending, completionRate };
  };

  const getStatusDistribution = () => {
    const stats = calculateStats();
    return [
      { name: "Completed", value: stats.completed, color: "hsl(var(--chart-1))" },
      { name: "In Progress", value: stats.inProgress, color: "hsl(var(--chart-2))" },
      { name: "Pending", value: stats.pending, color: "hsl(var(--chart-3))" },
      { name: "Failed", value: pickups.filter((p) => p.status === "failed").length, color: "hsl(var(--chart-4))" },
      { name: "Delayed", value: pickups.filter((p) => p.status === "delayed").length, color: "hsl(var(--chart-5))" },
    ].filter((item) => item.value > 0);
  };

  const getTrendData = () => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      return date.toISOString().split("T")[0];
    });

    return last7Days.map((date) => {
      const datePickups = pickups.filter(
        (p) => p.created_at.split("T")[0] === date
      );
      const completed = datePickups.filter((p) => p.status === "collected").length;

      return {
        date: new Date(date).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
        total: datePickups.length,
        completed,
      };
    });
  };

  const getMonthlyCompletion = () => {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const currentMonth = new Date().getMonth();
    const last6Months = Array.from({ length: 6 }, (_, i) => {
      const monthIndex = (currentMonth - (5 - i) + 12) % 12;
      return months[monthIndex];
    });

    return last6Months.map((month) => {
      const monthIndex = months.indexOf(month);
      const monthPickups = pickups.filter((p) => {
        const pickupMonth = new Date(p.created_at).getMonth();
        return pickupMonth === monthIndex;
      });
      const completed = monthPickups.filter((p) => p.status === "collected").length;
      const rate = monthPickups.length > 0 ? Math.round((completed / monthPickups.length) * 100) : 0;

      return {
        month,
        rate,
        completed,
        total: monthPickups.length,
      };
    });
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          Loading analytics...
        </div>
      </DashboardLayout>
    );
  }

  const stats = calculateStats();
  const statusData = getStatusDistribution();
  const trendData = getTrendData();
  const monthlyData = getMonthlyCompletion();

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Analytics</h1>
          <p className="text-muted-foreground">
            {role === "admin" ? "System-wide" : "Your"} pickup performance and trends
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Pickups</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.completed}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">In Progress</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.inProgress}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.completionRate}%</div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>7-Day Pickup Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" />
                  <YAxis stroke="hsl(var(--muted-foreground))" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="total"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    name="Total Pickups"
                  />
                  <Line
                    type="monotone"
                    dataKey="completed"
                    stroke="hsl(var(--chart-1))"
                    strokeWidth={2}
                    name="Completed"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Status Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="hsl(var(--primary))"
                    dataKey="value"
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>6-Month Completion Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
                  <YAxis stroke="hsl(var(--muted-foreground))" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                    content={({ payload }) => {
                      if (payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-card p-3 rounded-lg border border-border">
                            <p className="font-semibold">{data.month}</p>
                            <p className="text-sm">Rate: {data.rate}%</p>
                            <p className="text-sm">Completed: {data.completed}/{data.total}</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Legend />
                  <Bar dataKey="rate" fill="hsl(var(--primary))" name="Completion Rate (%)" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Analytics;
