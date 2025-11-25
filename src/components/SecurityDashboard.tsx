import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertTriangle, Shield, Activity, MapPin } from "lucide-react";
import { format } from "date-fns";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

interface SecurityAttempt {
  id: string;
  email: string;
  ip_address: string | null;
  success: boolean;
  error_reason: string | null;
  created_at: string;
}

interface IPStats {
  ip: string;
  attempts: number;
  lastAttempt: string;
}

const SecurityDashboard = () => {
  const [attempts, setAttempts] = useState<SecurityAttempt[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSecurityData();
  }, []);

  const fetchSecurityData = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("admin_key_attempts")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1000);

      if (error) throw error;
      setAttempts(data || []);
    } catch (error) {
      console.error("Error fetching security data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate metrics
  const totalAttempts = attempts.length;
  const failedAttempts = attempts.filter((a) => !a.success).length;
  const successfulAttempts = attempts.filter((a) => a.success).length;
  const uniqueIPs = new Set(attempts.map((a) => a.ip_address).filter(Boolean)).size;

  // Failed attempts by IP
  const ipStats: IPStats[] = Object.values(
    attempts
      .filter((a) => !a.success && a.ip_address)
      .reduce((acc, attempt) => {
        const ip = attempt.ip_address!;
        if (!acc[ip]) {
          acc[ip] = { ip, attempts: 0, lastAttempt: attempt.created_at };
        }
        acc[ip].attempts++;
        if (new Date(attempt.created_at) > new Date(acc[ip].lastAttempt)) {
          acc[ip].lastAttempt = attempt.created_at;
        }
        return acc;
      }, {} as Record<string, IPStats>)
  ).sort((a, b) => b.attempts - a.attempts);

  // Attempts over time (last 7 days)
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    return date.toISOString().split("T")[0];
  });

  const attemptsOverTime = last7Days.map((date) => {
    const dayAttempts = attempts.filter(
      (a) => a.created_at.split("T")[0] === date
    );
    return {
      date: format(new Date(date), "MMM dd"),
      failed: dayAttempts.filter((a) => !a.success).length,
      successful: dayAttempts.filter((a) => a.success).length,
    };
  });

  // Error reasons distribution
  const errorReasons = attempts
    .filter((a) => !a.success && a.error_reason)
    .reduce((acc, attempt) => {
      const reason = attempt.error_reason!;
      acc[reason] = (acc[reason] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

  const errorData = Object.entries(errorReasons).map(([name, value]) => ({
    name: name.length > 20 ? name.substring(0, 20) + "..." : name,
    value,
  }));

  const COLORS = ["hsl(var(--destructive))", "hsl(var(--warning))", "hsl(var(--muted))", "hsl(var(--accent))"];

  if (loading) {
    return <div className="p-6">Loading security data...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold">Security Dashboard</h2>
        <p className="text-muted-foreground">
          Monitor admin access attempts and identify suspicious activity
        </p>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Attempts</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalAttempts}</div>
            <p className="text-xs text-muted-foreground">All validation attempts</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed Attempts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{failedAttempts}</div>
            <p className="text-xs text-muted-foreground">
              {totalAttempts > 0 ? Math.round((failedAttempts / totalAttempts) * 100) : 0}% of total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Successful Logins</CardTitle>
            <Shield className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{successfulAttempts}</div>
            <p className="text-xs text-muted-foreground">Valid key validations</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unique IP Addresses</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{uniqueIPs}</div>
            <p className="text-xs text-muted-foreground">Different sources</p>
          </CardContent>
        </Card>
      </div>

      {/* Security Alerts */}
      {ipStats.filter((ip) => ip.attempts >= 3).length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Security Alert:</strong> {ipStats.filter((ip) => ip.attempts >= 3).length} IP
            address(es) with 3+ failed attempts detected. Review suspicious IPs below.
          </AlertDescription>
        </Alert>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Attempts Over Time */}
        <Card>
          <CardHeader>
            <CardTitle>Attempts Over Time (Last 7 Days)</CardTitle>
            <CardDescription>Daily failed and successful validation attempts</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={attemptsOverTime}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="failed" stroke="hsl(var(--destructive))" name="Failed" strokeWidth={2} />
                <Line type="monotone" dataKey="successful" stroke="hsl(var(--primary))" name="Successful" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Error Reasons Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Failure Reasons</CardTitle>
            <CardDescription>Distribution of failed attempt error types</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={errorData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => `${entry.name}: ${entry.value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {errorData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Suspicious IPs */}
      <Card>
        <CardHeader>
          <CardTitle>Suspicious IP Addresses</CardTitle>
          <CardDescription>IPs with multiple failed attempts (sorted by attempt count)</CardDescription>
        </CardHeader>
        <CardContent>
          {ipStats.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>IP Address</TableHead>
                  <TableHead>Failed Attempts</TableHead>
                  <TableHead>Last Attempt</TableHead>
                  <TableHead>Threat Level</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ipStats.slice(0, 10).map((ip) => (
                  <TableRow key={ip.ip}>
                    <TableCell className="font-mono">{ip.ip}</TableCell>
                    <TableCell>
                      <Badge variant={ip.attempts >= 5 ? "destructive" : ip.attempts >= 3 ? "default" : "secondary"}>
                        {ip.attempts} attempts
                      </Badge>
                    </TableCell>
                    <TableCell>{format(new Date(ip.lastAttempt), "PPpp")}</TableCell>
                    <TableCell>
                      {ip.attempts >= 5 ? (
                        <Badge variant="destructive">High</Badge>
                      ) : ip.attempts >= 3 ? (
                        <Badge className="bg-orange-500">Medium</Badge>
                      ) : (
                        <Badge variant="secondary">Low</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-sm text-muted-foreground">No failed attempts recorded</p>
          )}
        </CardContent>
      </Card>

      {/* Recent Attempts Log */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Validation Attempts</CardTitle>
          <CardDescription>Last 20 admin key validation attempts</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Timestamp</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>IP Address</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Error Reason</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {attempts.slice(0, 20).map((attempt) => (
                <TableRow key={attempt.id}>
                  <TableCell>{format(new Date(attempt.created_at), "PPpp")}</TableCell>
                  <TableCell>{attempt.email}</TableCell>
                  <TableCell className="font-mono">{attempt.ip_address || "N/A"}</TableCell>
                  <TableCell>
                    {attempt.success ? (
                      <Badge className="bg-primary">Success</Badge>
                    ) : (
                      <Badge variant="destructive">Failed</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {attempt.error_reason || "-"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default SecurityDashboard;
