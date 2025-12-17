import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getUserRole, type UserRole } from "@/lib/supabase";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Package, AlertCircle, MapPin, Calendar, ChevronLeft, ChevronRight, Filter } from "lucide-react";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";

interface Activity {
  id: string;
  type: "pickup" | "issue";
  title: string;
  status: string;
  location: string | null;
  date: string;
  description?: string;
}

const ITEMS_PER_PAGE = 10;

const ActivityHistory = () => {
  const navigate = useNavigate();
  const [role, setRole] = useState<UserRole | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [filteredActivities, setFilteredActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    const fetchActivities = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const userRole = await getUserRole(user.id);
      setRole(userRole);

      // Fetch pickups
      let pickupsQuery = supabase.from("waste_pickups").select("*");
      if (userRole === "citizen" || userRole === "company") {
        pickupsQuery = pickupsQuery.eq("user_id", user.id);
      } else if (userRole === "collector") {
        pickupsQuery = pickupsQuery.eq("collector_id", user.id);
      }
      const { data: pickups } = await pickupsQuery.order("created_at", { ascending: false });

      // Fetch issues
      let issuesQuery = supabase.from("issue_reports").select("*");
      if (userRole === "citizen" || userRole === "company") {
        issuesQuery = issuesQuery.eq("reporter_id", user.id);
      } else if (userRole === "collector") {
        issuesQuery = issuesQuery.eq("assigned_collector_id", user.id);
      }
      const { data: issues } = await issuesQuery.order("created_at", { ascending: false });

      // Combine activities
      const allActivities: Activity[] = [];

      pickups?.forEach((p) => {
        allActivities.push({
          id: p.id,
          type: "pickup",
          title: `Waste Pickup`,
          status: p.status,
          location: p.location,
          date: p.created_at,
          description: p.notes || undefined,
        });
      });

      issues?.forEach((i) => {
        allActivities.push({
          id: i.id,
          type: "issue",
          title: i.title,
          status: i.status,
          location: i.location,
          date: i.created_at,
          description: i.description,
        });
      });

      // Sort by date descending
      allActivities.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setActivities(allActivities);
      setFilteredActivities(allActivities);
      setLoading(false);
    };

    fetchActivities();
  }, []);

  // Apply filters
  useEffect(() => {
    let filtered = [...activities];

    if (typeFilter !== "all") {
      filtered = filtered.filter((a) => a.type === typeFilter);
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((a) => a.status === statusFilter);
    }

    setFilteredActivities(filtered);
    setCurrentPage(1);
  }, [typeFilter, statusFilter, activities]);

  const totalPages = Math.ceil(filteredActivities.length / ITEMS_PER_PAGE);
  const paginatedActivities = filteredActivities.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "collected":
      case "resolved":
        return "default";
      case "pending":
        return "secondary";
      case "in_progress":
        return "outline";
      case "failed":
        return "destructive";
      default:
        return "outline";
    }
  };

  const uniqueStatuses = [...new Set(activities.map((a) => a.status))];

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Loading activities...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Activity History</h2>
          <p className="text-muted-foreground mt-1">
            Complete history of your pickups and issues
          </p>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4" />
              <CardTitle className="text-base">Filters</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              <div className="w-48">
                <label className="text-sm text-muted-foreground mb-1 block">Type</label>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All types</SelectItem>
                    <SelectItem value="pickup">Pickups</SelectItem>
                    <SelectItem value="issue">Issues</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="w-48">
                <label className="text-sm text-muted-foreground mb-1 block">Status</label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All statuses</SelectItem>
                    {uniqueStatuses.map((status) => (
                      <SelectItem key={status} value={status}>
                        {status.replace("_", " ")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Activity List */}
        <Card>
          <CardHeader>
            <CardTitle>Activities</CardTitle>
            <CardDescription>
              Showing {paginatedActivities.length} of {filteredActivities.length} activities
            </CardDescription>
          </CardHeader>
          <CardContent>
            {paginatedActivities.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No activities found matching your filters.
              </p>
            ) : (
              <div className="space-y-3">
                {paginatedActivities.map((activity) => (
                  <div
                    key={`${activity.type}-${activity.id}`}
                    className="flex items-start gap-4 p-4 rounded-lg border bg-card cursor-pointer hover:bg-accent/50 transition-colors"
                    onClick={() =>
                      navigate(activity.type === "pickup" ? "/dashboard/pickups" : "/dashboard/issues")
                    }
                  >
                    <div className="shrink-0">
                      {activity.type === "pickup" ? (
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <Package className="w-5 h-5 text-primary" />
                        </div>
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center">
                          <AlertCircle className="w-5 h-5 text-destructive" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium truncate">{activity.title}</p>
                        <Badge variant={getStatusVariant(activity.status)} className="shrink-0">
                          {activity.status.replace("_", " ")}
                        </Badge>
                      </div>
                      {activity.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                          {activity.description}
                        </p>
                      )}
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        {activity.location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {activity.location}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {format(new Date(activity.date), "MMM d, yyyy 'at' h:mm a")}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-6 pt-4 border-t">
                <p className="text-sm text-muted-foreground">
                  Page {currentPage} of {totalPages}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default ActivityHistory;
