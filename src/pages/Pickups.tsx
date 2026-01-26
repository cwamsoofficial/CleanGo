import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getUserRole, type UserRole } from "@/lib/supabase";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Calendar, MapPin, CheckCircle, Clock, XCircle, Package, User, ClipboardList, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

interface Pickup {
  id: string;
  status: string;
  scheduled_date: string | null;
  location: string | null;
  notes: string | null;
  created_at: string;
  completed_at: string | null;
  collector_id: string | null;
  collector_name?: string;
  user_id: string;
  user_name?: string;
}

const Pickups = () => {
  const [role, setRole] = useState<UserRole | null>(null);
  const [pickups, setPickups] = useState<Pickup[]>([]);
  const [allPickups, setAllPickups] = useState<Pickup[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [acceptingPickup, setAcceptingPickup] = useState<string | null>(null);

  useEffect(() => {
    fetchPickups();
  }, []);

  const fetchPickups = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      setUserId(user.id);
      const userRole = await getUserRole(user.id);
      setRole(userRole);

      // For collectors, fetch assigned pickups and all unassigned pickups
      if (userRole === "collector") {
        // Fetch assigned pickups (collector's own)
        const { data: assignedData, error: assignedError } = await supabase
          .from("waste_pickups")
          .select("*")
          .eq("collector_id", user.id)
          .order("created_at", { ascending: false });

        if (assignedError) throw assignedError;

        // Fetch all pickups to get unassigned ones
        const { data: allData, error: allError } = await supabase
          .from("waste_pickups")
          .select("*")
          .order("created_at", { ascending: false });

        // Get user names for pickups
        const allUserIds = [...new Set([...(assignedData || []), ...(allData || [])].map(p => p.user_id))];
        const { data: userProfiles } = await supabase
          .from("profiles")
          .select("id, name")
          .in("id", allUserIds);

        const addUserNames = (pickupsList: any[]) => 
          pickupsList.map(pickup => {
            const profile = userProfiles?.find(p => p.id === pickup.user_id);
            return { ...pickup, user_name: profile?.name || "Unknown" };
          });

        setPickups(addUserNames(assignedData || []));
        setAllPickups(addUserNames(allData || []));
      } else {
        let query = supabase.from("waste_pickups").select("*");

        if (userRole === "citizen" || userRole === "company") {
          query = query.eq("user_id", user.id);
        }

        const { data, error } = await query.order("created_at", { ascending: false });

        if (error) throw error;

        // For admins, fetch collector names
        if (userRole === "admin" && data) {
          const collectorIds = data
            .filter(p => p.collector_id)
            .map(p => p.collector_id);

          if (collectorIds.length > 0) {
            const { data: profiles } = await supabase
              .from("profiles")
              .select("id, name")
              .in("id", collectorIds);

            const pickupsWithCollectors = data.map(pickup => {
              if (pickup.collector_id) {
                const profile = profiles?.find(p => p.id === pickup.collector_id);
                return { ...pickup, collector_name: profile?.name || "Unknown" };
              }
              return pickup;
            });

            setPickups(pickupsWithCollectors);
          } else {
            setPickups(data);
          }
        } else {
          setPickups(data || []);
        }
      }
    } catch (error: any) {
      toast.error("Failed to load pickups");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (pickupId: string, newStatus: "pending" | "in_progress" | "collected" | "failed" | "delayed") => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const updates: any = { status: newStatus, updated_at: new Date().toISOString() };
      
      // If collector is accepting a pending pickup, assign them as collector
      if (role === "collector" && newStatus === "in_progress") {
        updates.collector_id = user.id;
      }

      // Set completed_at when marking as collected
      if (newStatus === "collected") {
        updates.completed_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from("waste_pickups")
        .update(updates)
        .eq("id", pickupId);

      if (error) throw error;

      toast.success("Pickup status updated");
      fetchPickups();
    } catch (error: any) {
      toast.error("Failed to update status");
    }
  };

  const handleAcceptPickup = async (pickupId: string) => {
    try {
      setAcceptingPickup(pickupId);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("waste_pickups")
        .update({
          collector_id: user.id,
          status: "in_progress",
          updated_at: new Date().toISOString()
        })
        .eq("id", pickupId);

      if (error) throw error;

      toast.success("Pickup accepted successfully!");
      fetchPickups();
    } catch (error: any) {
      console.error("Error accepting pickup:", error);
      toast.error("Failed to accept pickup");
    } finally {
      setAcceptingPickup(null);
    }
  };

  const handleUnassign = async (pickupId: string) => {
    try {
      const { error } = await supabase
        .from("waste_pickups")
        .update({ 
          status: "pending", 
          collector_id: null,
          updated_at: new Date().toISOString() 
        })
        .eq("id", pickupId);

      if (error) throw error;

      toast.success("Pickup unassigned successfully");
      fetchPickups();
    } catch (error: any) {
      toast.error("Failed to unassign pickup");
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      pending: { variant: "secondary", icon: Clock },
      in_progress: { variant: "default", icon: Clock },
      collected: { variant: "default", icon: CheckCircle },
      failed: { variant: "destructive", icon: XCircle },
      delayed: { variant: "outline", icon: Clock },
    };

    const config = variants[status] || variants.pending;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="w-3 h-3" />
        {status.replace('_', ' ')}
      </Badge>
    );
  };

  const getPickupStats = () => {
    if (role !== "collector") return null;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const assignedToMe = pickups.filter(p => p.collector_id === userId).length;
    const inProgress = pickups.filter(p => p.status === "in_progress" && p.collector_id === userId).length;
    const completedToday = pickups.filter(p => {
      if (p.status !== "collected" || !p.completed_at || p.collector_id !== userId) return false;
      const completedDate = new Date(p.completed_at);
      completedDate.setHours(0, 0, 0, 0);
      return completedDate.getTime() === today.getTime();
    }).length;

    return (
      <div className="grid gap-4 md:grid-cols-3 mb-6" data-tour="pickup-stats">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Assigned</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{assignedToMe}</div>
            <p className="text-xs text-muted-foreground">Your pickups</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{inProgress}</div>
            <p className="text-xs text-muted-foreground">Active pickups</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed Today</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedToday}</div>
            <p className="text-xs text-muted-foreground">Done today</p>
          </CardContent>
        </Card>
      </div>
    );
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">Loading...</div>
      </DashboardLayout>
    );
  }

  // Collector-specific filtered lists
  const assignedPickups = pickups.filter(p => p.collector_id === userId && p.status !== "collected");
  const unassignedPickups = allPickups.filter(p => !p.collector_id && p.status === "pending");
  const completedPickups = pickups.filter(p => p.collector_id === userId && p.status === "collected");

  // Render collector view with tabs
  const renderCollectorView = () => (
    <Tabs defaultValue="assigned" className="w-full">
      <TabsList>
        <TabsTrigger value="assigned" className="flex items-center gap-2">
          <ClipboardList className="w-4 h-4" />
          Accepted/Pending Pickups
          {assignedPickups.length > 0 && (
            <Badge variant="default" className="ml-1">{assignedPickups.length}</Badge>
          )}
        </TabsTrigger>
        <TabsTrigger value="unassigned" className="flex items-center gap-2">
          <Package className="w-4 h-4" />
          Available Pickups
          {unassignedPickups.length > 0 && (
            <Badge variant="secondary" className="ml-1">{unassignedPickups.length}</Badge>
          )}
        </TabsTrigger>
        <TabsTrigger value="completed" className="flex items-center gap-2">
          <CheckCircle className="w-4 h-4" />
          Completed
          <Badge variant="outline" className="ml-1">{completedPickups.length}</Badge>
        </TabsTrigger>
      </TabsList>

      <TabsContent value="assigned" className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle>Your Assigned Pickups</CardTitle>
            <CardDescription>Pickups you're currently working on</CardDescription>
          </CardHeader>
          <CardContent>
            {assignedPickups.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No pickups assigned to you</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Requested By</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Scheduled</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {assignedPickups.map((pickup) => (
                    <TableRow key={pickup.id}>
                      <TableCell className="font-mono text-xs">{pickup.id.slice(0, 8)}</TableCell>
                      <TableCell>{pickup.user_name || "Unknown"}</TableCell>
                      <TableCell className="max-w-[200px] truncate">{pickup.location || "Not specified"}</TableCell>
                      <TableCell>
                        {pickup.scheduled_date ? format(new Date(pickup.scheduled_date), "MMM dd, yyyy") : "Not set"}
                      </TableCell>
                      <TableCell>{getStatusBadge(pickup.status)}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {pickup.status === "in_progress" && (
                            <>
                              <Button size="sm" onClick={() => handleUpdateStatus(pickup.id, "collected")}>
                                Complete
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => handleUpdateStatus(pickup.id, "delayed")}>
                                Delay
                              </Button>
                              <Button size="sm" variant="ghost" onClick={() => handleUnassign(pickup.id)}>
                                Unassign
                              </Button>
                            </>
                          )}
                          {pickup.status === "pending" && (
                            <Button size="sm" onClick={() => handleUpdateStatus(pickup.id, "in_progress")}>
                              Start
                            </Button>
                          )}
                          {(pickup.status === "delayed" || pickup.status === "failed") && (
                            <Button size="sm" onClick={() => handleUpdateStatus(pickup.id, "in_progress")}>
                              Resume
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="unassigned" className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle>Unassigned Pickups</CardTitle>
            <CardDescription>Available pickups you can accept</CardDescription>
          </CardHeader>
          <CardContent>
            {unassignedPickups.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No unassigned pickups at the moment</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Requested By</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Scheduled</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {unassignedPickups.map((pickup) => (
                    <TableRow key={pickup.id}>
                      <TableCell className="font-mono text-xs">{pickup.id.slice(0, 8)}</TableCell>
                      <TableCell>{pickup.user_name || "Unknown"}</TableCell>
                      <TableCell className="max-w-[200px] truncate">{pickup.location || "Not specified"}</TableCell>
                      <TableCell>
                        {pickup.scheduled_date ? format(new Date(pickup.scheduled_date), "MMM dd, yyyy") : "Not set"}
                      </TableCell>
                      <TableCell>{format(new Date(pickup.created_at), "MMM dd, yyyy")}</TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          disabled={acceptingPickup === pickup.id}
                          onClick={() => handleAcceptPickup(pickup.id)}
                          className="flex items-center gap-2"
                        >
                          {acceptingPickup === pickup.id ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <CheckCircle className="w-3 h-3" />
                          )}
                          Accept
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="completed" className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle>Completed Pickups</CardTitle>
            <CardDescription>Your pickup history</CardDescription>
          </CardHeader>
          <CardContent>
            {completedPickups.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No completed pickups yet</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Requested By</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Completed At</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {completedPickups.map((pickup) => (
                    <TableRow key={pickup.id}>
                      <TableCell className="font-mono text-xs">{pickup.id.slice(0, 8)}</TableCell>
                      <TableCell>{pickup.user_name || "Unknown"}</TableCell>
                      <TableCell className="max-w-[200px] truncate">{pickup.location || "Not specified"}</TableCell>
                      <TableCell>
                        {pickup.completed_at ? format(new Date(pickup.completed_at), "MMM dd, yyyy HH:mm") : "N/A"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );

  // Render citizen/company view (original card layout)
  const renderCitizenView = () => (
    <>
      {pickups.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <p className="text-muted-foreground">No pickups found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4" data-tour="pickup-list">
          {pickups.map((pickup) => (
            <Card key={pickup.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      Pickup #{pickup.id.slice(0, 8)}
                      {!pickup.collector_id && <Badge variant="outline">Unassigned</Badge>}
                    </CardTitle>
                    <CardDescription>
                      Scheduled: {pickup.scheduled_date ? new Date(pickup.scheduled_date).toLocaleDateString() : "Not set"}
                    </CardDescription>
                  </div>
                  {getStatusBadge(pickup.status)}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {pickup.location && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="w-4 h-4" />
                    {pickup.location}
                  </div>
                )}
                {pickup.notes && (
                  <p className="text-sm text-muted-foreground">{pickup.notes}</p>
                )}
                {pickup.status === "collected" && (
                  <div className="flex items-center gap-2 text-sm text-success">
                    <CheckCircle className="w-4 h-4" />
                    <span>Pickup confirmed! You earned +5 points</span>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </>
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-foreground">Pickups</h2>
            <p className="text-muted-foreground mt-1">
              {role === "collector" ? "View and manage pickup requests" : "View and track your waste collections"}
            </p>
          </div>
        </div>

        {getPickupStats()}

        {role === "collector" ? renderCollectorView() : renderCitizenView()}
      </div>
    </DashboardLayout>
  );
};

export default Pickups;
