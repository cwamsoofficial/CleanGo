import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, MapPin, Edit } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface Issue {
  id: string;
  title: string;
  status: string;
  location: string | null;
  created_at: string;
}

export function RecentIssues() {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchIssues();
  }, []);

  const fetchIssues = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("issue_reports")
        .select("id, title, status, location, created_at")
        .eq("reporter_id", user.id)
        .order("created_at", { ascending: false })
        .limit(5);

      if (error) throw error;
      setIssues(data || []);
    } catch (error) {
      console.error("Error fetching issues:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "resolved":
        return "default";
      case "in_progress":
        return "secondary";
      default:
        return "outline";
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Issues</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Loading...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Recent Issues</CardTitle>
            <CardDescription>Your reported issues</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={() => navigate("/dashboard/report-issue")}>
            <AlertCircle className="w-4 h-4 mr-2" />
            Report New
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {issues.length === 0 ? (
          <p className="text-sm text-muted-foreground">No issues reported yet</p>
        ) : (
          <div className="space-y-4">
            {issues.map((issue) => (
              <div key={issue.id} className="flex items-start justify-between gap-4 p-3 rounded-lg border bg-card">
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium text-sm">{issue.title}</h4>
                    <Badge variant={getStatusVariant(issue.status)} className="text-xs">
                      {issue.status.replace("_", " ")}
                    </Badge>
                  </div>
                  {issue.location && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="w-3 h-3" />
                      {issue.location}
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {new Date(issue.created_at).toLocaleDateString()}
                  </p>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Edit className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
