import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { format } from "date-fns";
import { Package, AlertCircle, User, Clock, CheckCircle, XCircle, Users, BarChart3, Search } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";

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
  completed_at: string | null;
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
  
  // Filter states
  const [pickupSearch, setPickupSearch] = useState("");
  const [pickupStatusFilter, setPickupStatusFilter] = useState<string>("all");
  const [pickupCollectorFilter, setPickupCollectorFilter] = useState<string>("all");
  const [issueSearch, setIssueSearch] = useState("");
  const [issueStatusFilter, setIssueStatusFilter] = useState<string>("all");
  const [issueCollectorFilter, setIssueCollectorFilter] = useState<string>("all");

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

  // Filter pickups
  const filteredPickups = pickups.filter((pickup) => {
    const matchesSearch = pickupSearch === "" || 
      pickup.user_name?.toLowerCase().includes(pickupSearch.toLowerCase()) ||
      pickup.location?.toLowerCase().includes(pickupSearch.toLowerCase()) ||
      pickup.id.toLowerCase().includes(pickupSearch.toLowerCase());
    const matchesStatus = pickupStatusFilter === "all" || pickup.status === pickupStatusFilter;
    const matchesCollector = pickupCollectorFilter === "all" || 
      (pickupCollectorFilter === "unassigned" ? !pickup.collector_id : pickup.collector_id === pickupCollectorFilter);
    return matchesSearch && matchesStatus && matchesCollector;
  });

  // Filter issues
  const filteredIssues = issues.filter((issue) => {
    const matchesSearch = issueSearch === "" || 
      issue.title.toLowerCase().includes(issueSearch.toLowerCase()) ||
      issue.reporter_name?.toLowerCase().includes(issueSearch.toLowerCase()) ||
      issue.location?.toLowerCase().includes(issueSearch.toLowerCase());
    const matchesStatus = issueStatusFilter === "all" || issue.status === issueStatusFilter;
    const matchesCollector = issueCollectorFilter === "all" || 
      (issueCollectorFilter === "unassigned" ? !issue.assigned_collector_id : issue.assigned_collector_id === issueCollectorFilter);
    return matchesSearch && matchesStatus && matchesCollector;
  });

  const unassignedPickups = pickups.filter((p) => !p.collector_id && p.status === "pending");
  const unassignedIssues = issues.filter((i) => !i.assigned_collector_id && i.status === "pending");

  // Calculate workload per collector
  const collectorWorkloads = collectors.map((collector) => {
    const assignedPickupsCount = pickups.filter((p) => p.collector_id === collector.id).length;
    const activePickupsCount = pickups.filter((p) => p.collector_id === collector.id && p.status === "in_progress").length;
    const completedPickupsCount = pickups.filter((p) => p.collector_id === collector.id && p.status === "collected").length;
    const assignedIssuesCount = issues.filter((i) => i.assigned_collector_id === collector.id).length;
    const activeIssuesCount = issues.filter((i) => i.assigned_collector_id === collector.id && i.status === "in_progress").length;
    const resolvedIssuesCount = issues.filter((i) => i.assigned_collector_id === collector.id && i.status === "resolved").length;
    const totalActive = activePickupsCount + activeIssuesCount;
    const totalAssigned = assignedPickupsCount + assignedIssuesCount;

    return {
      ...collector,
      assignedPickups: assignedPickupsCount,
      activePickups: activePickupsCount,
      completedPickups: completedPickupsCount,
      assignedIssues: assignedIssuesCount,
      activeIssues: activeIssuesCount,
      resolvedIssues: resolvedIssuesCount,
      totalActive,
      totalAssigned,
    };
  });

  const maxWorkload = Math.max(...collectorWorkloads.map((c) => c.totalAssigned), 1);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading assignments...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="workload" className="w-full">
        <TabsList>
          <TabsTrigger value="workload" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Workload
          </TabsTrigger>
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

        <TabsContent value="workload" className="space-y-6 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Collector Workload Overview
              </CardTitle>
              <CardDescription>
                View active assignments per collector
              </CardDescription>
            </CardHeader>
            <CardContent>
              {collectorWorkloads.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">
                  No collectors available
                </p>
              ) : (
                <div className="space-y-6">
                  {collectorWorkloads.map((collector) => (
                    <div key={collector.id} className="space-y-3 p-4 rounded-lg border">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <User className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <h4 className="font-semibold">{collector.name}</h4>
                            <p className="text-sm text-muted-foreground">
                              {collector.totalActive} active · {collector.totalAssigned} total assigned
                            </p>
                          </div>
                        </div>
                        <Badge variant={collector.totalActive > 5 ? "destructive" : collector.totalActive > 2 ? "default" : "secondary"}>
                          {collector.totalActive > 5 ? "High Load" : collector.totalActive > 2 ? "Moderate" : "Light"}
                        </Badge>
                      </div>
                      
                      <Progress value={(collector.totalAssigned / maxWorkload) * 100} className="h-2" />
                      
                      <div className="grid grid-cols-2 gap-4 pt-2">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm font-medium">
                            <Package className="w-4 h-4" />
                            Pickups
                          </div>
                          <div className="grid grid-cols-3 gap-2 text-sm">
                            <div className="flex flex-col items-center p-2 bg-muted/50 rounded">
                              <span className="font-bold text-lg">{collector.activePickups}</span>
                              <span className="text-xs text-muted-foreground">Active</span>
                            </div>
                            <div className="flex flex-col items-center p-2 bg-muted/50 rounded">
                              <span className="font-bold text-lg">{collector.completedPickups}</span>
                              <span className="text-xs text-muted-foreground">Done</span>
                            </div>
                            <div className="flex flex-col items-center p-2 bg-muted/50 rounded">
                              <span className="font-bold text-lg">{collector.assignedPickups}</span>
                              <span className="text-xs text-muted-foreground">Total</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm font-medium">
                            <AlertCircle className="w-4 h-4" />
                            Issues
                          </div>
                          <div className="grid grid-cols-3 gap-2 text-sm">
                            <div className="flex flex-col items-center p-2 bg-muted/50 rounded">
                              <span className="font-bold text-lg">{collector.activeIssues}</span>
                              <span className="text-xs text-muted-foreground">Active</span>
                            </div>
                            <div className="flex flex-col items-center p-2 bg-muted/50 rounded">
                              <span className="font-bold text-lg">{collector.resolvedIssues}</span>
                              <span className="text-xs text-muted-foreground">Done</span>
                            </div>
                            <div className="flex flex-col items-center p-2 bg-muted/50 rounded">
                              <span className="font-bold text-lg">{collector.assignedIssues}</span>
                              <span className="text-xs text-muted-foreground">Total</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pickups" className="space-y-6 mt-4">
          {/* Filter Controls */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-wrap gap-4">
                <div className="flex-1 min-w-[200px]">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by name, location, or ID..."
                      value={pickupSearch}
                      onChange={(e) => setPickupSearch(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>
                <Select value={pickupStatusFilter} onValueChange={setPickupStatusFilter}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="collected">Collected</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={pickupCollectorFilter} onValueChange={setPickupCollectorFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Collector" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Collectors</SelectItem>
                    <SelectItem value="unassigned">Unassigned</SelectItem>
                    {collectors.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {(pickupSearch || pickupStatusFilter !== "all" || pickupCollectorFilter !== "all") && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setPickupSearch("");
                      setPickupStatusFilter("all");
                      setPickupCollectorFilter("all");
                    }}
                  >
                    Clear Filters
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Filtered Pickups */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5" />
                Pickups
                <Badge variant="secondary" className="ml-2">{filteredPickups.length}</Badge>
              </CardTitle>
              <CardDescription>
                {pickupSearch || pickupStatusFilter !== "all" || pickupCollectorFilter !== "all" 
                  ? `Showing ${filteredPickups.length} of ${pickups.length} pickups`
                  : "All pickup requests"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {filteredPickups.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">
                  No pickups match the current filters
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
                      <TableHead>Completed At</TableHead>
                      <TableHead>Assigned To</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPickups.map((pickup) => {
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
                          <TableCell>
                            {pickup.scheduled_date
                              ? format(new Date(pickup.scheduled_date), "MMM dd, yyyy")
                              : "Not set"}
                          </TableCell>
                          <TableCell>{getStatusBadge(pickup.status)}</TableCell>
                          <TableCell>
                            {pickup.completed_at
                              ? format(new Date(pickup.completed_at), "MMM dd, yyyy HH:mm")
                              : "-"}
                          </TableCell>
                          <TableCell>
                            {collector ? (
                              <div className="flex items-center gap-2">
                                <User className="w-4 h-4 text-muted-foreground" />
                                {collector.name}
                              </div>
                            ) : (
                              <span className="text-muted-foreground">Unassigned</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Select
                              value={pickup.collector_id || ""}
                              onValueChange={(value) =>
                                handleAssignPickup(pickup.id, value === "unassign" ? null : value)
                              }
                            >
                              <SelectTrigger className="w-[150px]">
                                <SelectValue placeholder="Assign" />
                              </SelectTrigger>
                              <SelectContent>
                                {pickup.collector_id && (
                                  <SelectItem value="unassign">
                                    <span className="text-destructive">Unassign</span>
                                  </SelectItem>
                                )}
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
          {/* Filter Controls */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-wrap gap-4">
                <div className="flex-1 min-w-[200px]">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by title, reporter, or location..."
                      value={issueSearch}
                      onChange={(e) => setIssueSearch(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>
                <Select value={issueStatusFilter} onValueChange={setIssueStatusFilter}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={issueCollectorFilter} onValueChange={setIssueCollectorFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Collector" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Collectors</SelectItem>
                    <SelectItem value="unassigned">Unassigned</SelectItem>
                    {collectors.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {(issueSearch || issueStatusFilter !== "all" || issueCollectorFilter !== "all") && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setIssueSearch("");
                      setIssueStatusFilter("all");
                      setIssueCollectorFilter("all");
                    }}
                  >
                    Clear Filters
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Filtered Issues */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                Issues
                <Badge variant="secondary" className="ml-2">{filteredIssues.length}</Badge>
              </CardTitle>
              <CardDescription>
                {issueSearch || issueStatusFilter !== "all" || issueCollectorFilter !== "all" 
                  ? `Showing ${filteredIssues.length} of ${issues.length} issues`
                  : "All issue reports"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {filteredIssues.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">
                  No issues match the current filters
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
                      <TableHead>Assigned To</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredIssues.map((issue) => {
                      const collector = collectors.find((c) => c.id === issue.assigned_collector_id);
                      return (
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
                            {collector ? (
                              <div className="flex items-center gap-2">
                                <User className="w-4 h-4 text-muted-foreground" />
                                {collector.name}
                              </div>
                            ) : (
                              <span className="text-muted-foreground">Unassigned</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Select
                              value={issue.assigned_collector_id || ""}
                              onValueChange={(value) =>
                                handleAssignIssue(issue.id, value === "unassign" ? null : value)
                              }
                            >
                              <SelectTrigger className="w-[150px]">
                                <SelectValue placeholder="Assign" />
                              </SelectTrigger>
                              <SelectContent>
                                {issue.assigned_collector_id && (
                                  <SelectItem value="unassign">
                                    <span className="text-destructive">Unassign</span>
                                  </SelectItem>
                                )}
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
