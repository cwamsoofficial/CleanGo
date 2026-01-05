import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { format } from "date-fns";
import { Package, AlertCircle, User, Clock, CheckCircle, XCircle } from "lucide-react";

interface Collector {
  id: string;
  name: string;
}

interface Pickup {
  id: string;
  status: string;
  scheduled_date: string | null;
  location: string | null;
  notes: string | null;
  created_at: string;
  collector_id: string | null;
  user_name?: string;
}

interface Issue {
  id: string;
  title: string;
  description: string;
  status: string;
  location: string | null;
  created_at: string;
  assigned_collector_id: string | null;
  reporter_name?: string;
}

export default function AdminAssignments() {
  const [collectors, setCollectors] = useState<Collector[]>([]);
  const [pickups, setPickups] = useState<Pickup[]>([]);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch all collectors
      const { data: rolesData } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "collector");

      const collectorIds = rolesData?.map((r) => r.user_id) || [];

      if (collectorIds.length > 0) {
        const { data: profilesData } = await supabase
          .from("profiles")
          .select("id, name")
          .in("id", collectorIds);

        setCollectors(profilesData || []);
      }

      // Fetch all pickups
      const { data: pickupsData } = await supabase
        .from("waste_pickups")
        .select("*")
        .order("created_at", { ascending: false });

      // Fetch user names for pickups
      if (pickupsData && pickupsData.length > 0) {
        const userIds = [...new Set(pickupsData.map((p) => p.user_id))];
        const { data: userProfiles } = await supabase
          .from("profiles")
          .select("id, name")
          .in("id", userIds);

        const pickupsWithNames = pickupsData.map((pickup) => {
          const profile = userProfiles?.find((p) => p.id === pickup.user_id);
          return { ...pickup, user_name: profile?.name || "Unknown" };
        });
        setPickups(pickupsWithNames);
      } else {
        setPickups([]);
      }

      // Fetch all issues
      const { data: issuesData } = await supabase
        .from("issue_reports")
        .select("*")
        .order("created_at", { ascending: false });

      // Fetch reporter names for issues
      if (issuesData && issuesData.length > 0) {
        const reporterIds = [...new Set(issuesData.map((i) => i.reporter_id))];
        const { data: reporterProfiles } = await supabase
          .from("profiles")
          .select("id, name")
          .in("id", reporterIds);

        const issuesWithNames = issuesData.map((issue) => {
          const profile = reporterProfiles?.find((p) => p.id === issue.reporter_id);
          return { ...issue, reporter_name: profile?.name || "Unknown" };
        });
        setIssues(issuesWithNames);
      } else {
        setIssues([]);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const handleAssignPickup = async (pickupId: string, collectorId: string | null) => {
    try {
      const { error } = await supabase
        .from("waste_pickups")
        .update({
          collector_id: collectorId,
          status: collectorId ? "in_progress" : "pending",
          updated_at: new Date().toISOString(),
        })
        .eq("id", pickupId);

      if (error) throw error;

      toast.success(collectorId ? "Pickup assigned successfully" : "Pickup unassigned");
      fetchData();
    } catch (error) {
      console.error("Error assigning pickup:", error);
      toast.error("Failed to assign pickup");
    }
  };

  const handleAssignIssue = async (issueId: string, collectorId: string | null) => {
    try {
      const { error } = await supabase
        .from("issue_reports")
        .update({
          assigned_collector_id: collectorId,
          status: collectorId ? "in_progress" : "pending",
          updated_at: new Date().toISOString(),
        })
        .eq("id", issueId);

      if (error) throw error;

      toast.success(collectorId ? "Issue assigned successfully" : "Issue unassigned");
      fetchData();
    } catch (error) {
      console.error("Error assigning issue:", error);
      toast.error("Failed to assign issue");
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; icon: any }> = {
      pending: { variant: "secondary", icon: Clock },
      in_progress: { variant: "default", icon: Clock },
      collected: { variant: "default", icon: CheckCircle },
      resolved: { variant: "default", icon: CheckCircle },
      failed: { variant: "destructive", icon: XCircle },
      delayed: { variant: "outline", icon: Clock },
    };

    const config = variants[status] || variants.pending;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1 w-fit">
        <Icon className="w-3 h-3" />
        {status.replace("_", " ")}
      </Badge>
    );
  };

  const unassignedPickups = pickups.filter((p) => !p.collector_id && p.status === "pending");
  const assignedPickups = pickups.filter((p) => p.collector_id);
  const unassignedIssues = issues.filter((i) => !i.assigned_collector_id && i.status === "pending");
  const assignedIssues = issues.filter((i) => i.assigned_collector_id);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading assignments...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="pickups" className="w-full">
        <TabsList>
          <TabsTrigger value="pickups" className="flex items-center gap-2">
            <Package className="w-4 h-4" />
            Pickups
            {unassignedPickups.length > 0 && (
              <Badge variant="destructive" className="ml-1">{unassignedPickups.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="issues" className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            Issues
            {unassignedIssues.length > 0 && (
              <Badge variant="destructive" className="ml-1">{unassignedIssues.length}</Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pickups" className="space-y-6 mt-4">
          {/* Unassigned Pickups */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5" />
                Unassigned Pickups
              </CardTitle>
              <CardDescription>
                Assign collectors to pending pickup requests
              </CardDescription>
            </CardHeader>
            <CardContent>
              {unassignedPickups.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">
                  No unassigned pickups
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Requested By</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Scheduled</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Assign To</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {unassignedPickups.map((pickup) => (
                      <TableRow key={pickup.id}>
                        <TableCell className="font-mono text-xs">
                          {pickup.id.slice(0, 8)}
                        </TableCell>
                        <TableCell>{pickup.user_name}</TableCell>
                        <TableCell className="max-w-[200px] truncate">
                          {pickup.location || "Not specified"}
                        </TableCell>
                        <TableCell>
                          {pickup.scheduled_date
                            ? format(new Date(pickup.scheduled_date), "MMM dd, yyyy")
                            : "Not set"}
                        </TableCell>
                        <TableCell>{getStatusBadge(pickup.status)}</TableCell>
                        <TableCell>
                          <Select
                            onValueChange={(value) => handleAssignPickup(pickup.id, value)}
                          >
                            <SelectTrigger className="w-[180px]">
                              <SelectValue placeholder="Select collector" />
                            </SelectTrigger>
                            <SelectContent>
                              {collectors.map((collector) => (
                                <SelectItem key={collector.id} value={collector.id}>
                                  <div className="flex items-center gap-2">
                                    <User className="w-4 h-4" />
                                    {collector.name}
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Assigned Pickups */}
          <Card>
            <CardHeader>
              <CardTitle>Assigned Pickups</CardTitle>
              <CardDescription>
                Pickups currently assigned to collectors
              </CardDescription>
            </CardHeader>
            <CardContent>
              {assignedPickups.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">
                  No assigned pickups
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Requested By</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Assigned To</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {assignedPickups.map((pickup) => {
                      const collector = collectors.find((c) => c.id === pickup.collector_id);
                      return (
                        <TableRow key={pickup.id}>
                          <TableCell className="font-mono text-xs">
                            {pickup.id.slice(0, 8)}
                          </TableCell>
                          <TableCell>{pickup.user_name}</TableCell>
                          <TableCell className="max-w-[200px] truncate">
                            {pickup.location || "Not specified"}
                          </TableCell>
                          <TableCell>{getStatusBadge(pickup.status)}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <User className="w-4 h-4 text-muted-foreground" />
                              {collector?.name || "Unknown"}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Select
                              value={pickup.collector_id || ""}
                              onValueChange={(value) =>
                                handleAssignPickup(pickup.id, value === "unassign" ? null : value)
                              }
                            >
                              <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Reassign" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="unassign">
                                  <span className="text-destructive">Unassign</span>
                                </SelectItem>
                                {collectors.map((c) => (
                                  <SelectItem key={c.id} value={c.id}>
                                    <div className="flex items-center gap-2">
                                      <User className="w-4 h-4" />
                                      {c.name}
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="issues" className="space-y-6 mt-4">
          {/* Unassigned Issues */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                Unassigned Issues
              </CardTitle>
              <CardDescription>
                Assign collectors to pending issue reports
              </CardDescription>
            </CardHeader>
            <CardContent>
              {unassignedIssues.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">
                  No unassigned issues
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Reported By</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Assign To</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {unassignedIssues.map((issue) => (
                      <TableRow key={issue.id}>
                        <TableCell className="max-w-[200px] truncate font-medium">
                          {issue.title}
                        </TableCell>
                        <TableCell>{issue.reporter_name}</TableCell>
                        <TableCell className="max-w-[150px] truncate">
                          {issue.location || "Not specified"}
                        </TableCell>
                        <TableCell>
                          {format(new Date(issue.created_at), "MMM dd, yyyy")}
                        </TableCell>
                        <TableCell>{getStatusBadge(issue.status)}</TableCell>
                        <TableCell>
                          <Select
                            onValueChange={(value) => handleAssignIssue(issue.id, value)}
                          >
                            <SelectTrigger className="w-[180px]">
                              <SelectValue placeholder="Select collector" />
                            </SelectTrigger>
                            <SelectContent>
                              {collectors.map((collector) => (
                                <SelectItem key={collector.id} value={collector.id}>
                                  <div className="flex items-center gap-2">
                                    <User className="w-4 h-4" />
                                    {collector.name}
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Assigned Issues */}
          <Card>
            <CardHeader>
              <CardTitle>Assigned Issues</CardTitle>
              <CardDescription>
                Issues currently assigned to collectors
              </CardDescription>
            </CardHeader>
            <CardContent>
              {assignedIssues.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">
                  No assigned issues
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Reported By</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Assigned To</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {assignedIssues.map((issue) => {
                      const collector = collectors.find(
                        (c) => c.id === issue.assigned_collector_id
                      );
                      return (
                        <TableRow key={issue.id}>
                          <TableCell className="max-w-[200px] truncate font-medium">
                            {issue.title}
                          </TableCell>
                          <TableCell>{issue.reporter_name}</TableCell>
                          <TableCell className="max-w-[150px] truncate">
                            {issue.location || "Not specified"}
                          </TableCell>
                          <TableCell>{getStatusBadge(issue.status)}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <User className="w-4 h-4 text-muted-foreground" />
                              {collector?.name || "Unknown"}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Select
                              value={issue.assigned_collector_id || ""}
                              onValueChange={(value) =>
                                handleAssignIssue(issue.id, value === "unassign" ? null : value)
                              }
                            >
                              <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Reassign" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="unassign">
                                  <span className="text-destructive">Unassign</span>
                                </SelectItem>
                                {collectors.map((c) => (
                                  <SelectItem key={c.id} value={c.id}>
                                    <div className="flex items-center gap-2">
                                      <User className="w-4 h-4" />
                                      {c.name}
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
