import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getUserRole, type UserRole } from "@/lib/supabase";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, CheckCircle, Clock, XCircle } from "lucide-react";
import { toast } from "sonner";

interface Pickup {
  id: string;
  status: string;
  scheduled_date: string | null;
  location: string | null;
  notes: string | null;
  created_at: string;
  collector_id: string | null;
}

const Pickups = () => {
  const [role, setRole] = useState<UserRole | null>(null);
  const [pickups, setPickups] = useState<Pickup[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPickups();
  }, []);

  const fetchPickups = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const userRole = await getUserRole(user.id);
      setRole(userRole);

      let query = supabase.from("waste_pickups").select("*");

      if (userRole === "citizen" || userRole === "company") {
        query = query.eq("user_id", user.id);
      }
      // Collectors and admins see all pickups

      const { data, error } = await query.order("created_at", { ascending: false });

      if (error) throw error;

      setPickups(data || []);
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

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">Loading...</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-foreground">Waste Pickups</h2>
            <p className="text-muted-foreground mt-1">
              {role === "collector" ? "View and manage pickup requests" : "View and track your waste collections"}
            </p>
          </div>
        </div>

        {pickups.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <p className="text-muted-foreground">No pickups found</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
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

                  {role === "collector" && pickup.status === "pending" && (
                    <div className="flex gap-2 pt-2">
                      <Button
                        size="sm"
                        onClick={() => handleUpdateStatus(pickup.id, "in_progress")}
                      >
                        Accept Pickup
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleUpdateStatus(pickup.id, "delayed")}
                      >
                        Mark as Delayed
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleUpdateStatus(pickup.id, "failed")}
                      >
                        Mark as Failed
                      </Button>
                    </div>
                  )}

                  {role === "collector" && pickup.status === "in_progress" && (
                    <div className="flex gap-2 pt-2">
                      <Button
                        size="sm"
                        onClick={() => handleUpdateStatus(pickup.id, "collected")}
                      >
                        Complete Pickup
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleUpdateStatus(pickup.id, "failed")}
                      >
                        Mark as Failed
                      </Button>
                    </div>
                  )}

                  {(role === "citizen" || role === "company") && pickup.status === "collected" && (
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
      </div>
    </DashboardLayout>
  );
};

export default Pickups;
