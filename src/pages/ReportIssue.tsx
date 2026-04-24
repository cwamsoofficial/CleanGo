import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ReportIssueDialog } from "@/components/ReportIssueDialog";
import { WasteMap, type WasteMapPoint } from "@/components/WasteMap";
import { WasteDashboard } from "@/components/WasteDashboard";
import { AlertCircle, MapPin, Calendar, FileText, Map as MapIcon, BarChart3 } from "lucide-react";
import { format } from "date-fns";

interface IssueReport {
  id: string;
  title: string;
  description: string;
  status: string;
  category: string | null;
  location: string | null;
  created_at: string;
  image_url: string | null;
}

const ReportIssue = () => {
  const [reports, setReports] = useState<IssueReport[]>([]);
  const [mapPoints, setMapPoints] = useState<WasteMapPoint[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchReports = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("issue_reports")
      .select("*")
      .eq("reporter_id", user.id)
      .order("created_at", { ascending: false });

    if (!error && data) setReports(data as IssueReport[]);
    setLoading(false);
  };

  const fetchMapData = async () => {
    const { data, error } = await supabase.rpc("get_waste_map_data");
    if (!error && data) setMapPoints(data as WasteMapPoint[]);
  };

  useEffect(() => {
    fetchReports();
    fetchMapData();

    const channel = supabase
      .channel("issue-reports-feed")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "issue_reports" },
        () => {
          fetchReports();
          fetchMapData();
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "resolved":
        return "default";
      case "pending":
        return "secondary";
      case "in_progress":
        return "outline";
      default:
        return "outline";
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2 className="text-3xl font-bold text-foreground">SafeWaste Module</h2>
            <p className="text-muted-foreground mt-1">
              Report issues, view live waste hotspots, and track community insights
            </p>
          </div>
          <ReportIssueDialog
            onSuccess={() => {
              fetchReports();
              fetchMapData();
            }}
          />
        </div>

        <Tabs defaultValue="reports" className="space-y-4">
          <TabsList>
            <TabsTrigger value="reports" className="gap-2">
              <FileText className="h-4 w-4" /> My Reports
            </TabsTrigger>
            <TabsTrigger value="map" className="gap-2">
              <MapIcon className="h-4 w-4" /> Waste Map
            </TabsTrigger>
            <TabsTrigger value="dashboard" className="gap-2">
              <BarChart3 className="h-4 w-4" /> Insights
            </TabsTrigger>
          </TabsList>

          <TabsContent value="reports" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Reports</CardTitle>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{reports.length}</div>
                  <p className="text-xs text-muted-foreground">All time submissions</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Pending</CardTitle>
                  <AlertCircle className="h-4 w-4 text-amber-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {reports.filter((r) => r.status === "pending").length}
                  </div>
                  <p className="text-xs text-muted-foreground">Awaiting review</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Resolved</CardTitle>
                  <AlertCircle className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {reports.filter((r) => r.status === "resolved").length}
                  </div>
                  <p className="text-xs text-muted-foreground">Successfully resolved</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Your Reported Issues</CardTitle>
                <CardDescription>
                  {reports.length === 0
                    ? "You haven't reported any issues yet"
                    : `Showing ${reports.length} report${reports.length === 1 ? "" : "s"}`}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    Loading reports...
                  </p>
                ) : reports.length === 0 ? (
                  <div className="text-center py-8">
                    <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No reports yet</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Click "Create Report" to submit your first issue
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {reports.map((report) => (
                      <div
                        key={report.id}
                        className="flex items-start gap-4 p-4 rounded-lg border bg-card"
                      >
                        <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center shrink-0">
                          <AlertCircle className="w-5 h-5 text-destructive" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <p className="font-medium truncate">{report.title}</p>
                            <Badge
                              variant={getStatusVariant(report.status)}
                              className="shrink-0"
                            >
                              {report.status.replace("_", " ")}
                            </Badge>
                            {report.category && (
                              <Badge variant="outline" className="capitalize shrink-0">
                                {report.category.replace(/_/g, " ")}
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                            {report.description}
                          </p>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                            {report.location && (
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                {report.location}
                              </span>
                            )}
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {format(new Date(report.created_at), "MMM d, yyyy")}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="map">
            <Card>
              <CardHeader>
                <CardTitle>Live Waste Map</CardTitle>
                <CardDescription>
                  Reported locations and hotspots from across the community
                </CardDescription>
              </CardHeader>
              <CardContent>
                <WasteMap points={mapPoints} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="dashboard">
            <WasteDashboard />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default ReportIssue;
