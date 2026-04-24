import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, TrendingUp, MapPin, AlertCircle, Loader2 } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface DashboardStats {
  total: number;
  pending: number;
  in_progress: number;
  resolved: number;
  last_7_days: number;
  by_category: { category: string; count: number }[];
  top_locations: { location: string; count: number }[];
  trend: { day: string; count: number }[];
}

const categoryLabel = (c: string) =>
  c.replace(/_/g, " ").replace(/\b\w/g, (m) => m.toUpperCase());

export function WasteDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data, error } = await supabase.rpc("get_waste_dashboard_stats");
      if (!error && data) setStats(data as unknown as DashboardStats);
      setLoading(false);
    };
    load();

    const channel = supabase
      .channel("waste-dashboard")
      .on("postgres_changes", { event: "*", schema: "public", table: "issue_reports" }, load)
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (!stats) return <p className="text-muted-foreground">Unable to load insights.</p>;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium">Total Reports</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">All-time submissions</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium">Last 7 Days</CardTitle>
            <TrendingUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{stats.last_7_days}</div>
            <p className="text-xs text-muted-foreground">New reports this week</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <AlertCircle className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
            <p className="text-xs text-muted-foreground">Awaiting action</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium">Resolved</CardTitle>
            <AlertCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.resolved}</div>
            <p className="text-xs text-muted-foreground">Successfully cleared</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Reports by Category</CardTitle>
            <CardDescription>Breakdown of reported waste types</CardDescription>
          </CardHeader>
          <CardContent>
            {stats.by_category.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">No data yet</p>
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={stats.by_category.map((c) => ({ ...c, label: categoryLabel(c.category) }))}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} interval={0} angle={-20} textAnchor="end" height={60} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>14-Day Trend</CardTitle>
            <CardDescription>Daily report volume</CardDescription>
          </CardHeader>
          <CardContent>
            {stats.trend.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">No recent activity</p>
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={stats.trend}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="day" tick={{ fontSize: 10 }} tickFormatter={(d) => d.slice(5)} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="count" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-4 w-4" /> Top Reported Locations
          </CardTitle>
          <CardDescription>Emerging hotspots needing attention</CardDescription>
        </CardHeader>
        <CardContent>
          {stats.top_locations.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              No location data reported yet
            </p>
          ) : (
            <div className="space-y-2">
              {stats.top_locations.map((loc, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-3 rounded-md border bg-card"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-full bg-primary/10 text-primary text-xs font-semibold flex items-center justify-center">
                      {i + 1}
                    </div>
                    <span className="text-sm font-medium truncate">{loc.location}</span>
                  </div>
                  <span className="text-sm text-muted-foreground">{loc.count} reports</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
