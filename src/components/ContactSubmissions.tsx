import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Mail, Eye, Trash2, CheckCircle, Clock, RefreshCw } from "lucide-react";
import { format } from "date-fns";

interface ContactSubmission {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  created_at: string;
  read: boolean;
  responded_at: string | null;
}

const ContactSubmissions = () => {
  const [submissions, setSubmissions] = useState<ContactSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubmission, setSelectedSubmission] = useState<ContactSubmission | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const fetchSubmissions = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("contact_submissions")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setSubmissions(data || []);
    } catch (error) {
      console.error("Error fetching submissions:", error);
      toast.error("Failed to load contact submissions");
    } finally {
      setLoading(false);
    }
  };

  const handleViewSubmission = async (submission: ContactSubmission) => {
    setSelectedSubmission(submission);
    setDialogOpen(true);

    // Mark as read if not already
    if (!submission.read) {
      try {
        await supabase
          .from("contact_submissions")
          .update({ read: true })
          .eq("id", submission.id);

        setSubmissions(prev =>
          prev.map(s => (s.id === submission.id ? { ...s, read: true } : s))
        );
      } catch (error) {
        console.error("Error marking as read:", error);
      }
    }
  };

  const handleMarkResponded = async (id: string) => {
    try {
      const { error } = await supabase
        .from("contact_submissions")
        .update({ responded_at: new Date().toISOString() })
        .eq("id", id);

      if (error) throw error;

      setSubmissions(prev =>
        prev.map(s =>
          s.id === id ? { ...s, responded_at: new Date().toISOString() } : s
        )
      );
      
      if (selectedSubmission?.id === id) {
        setSelectedSubmission(prev => 
          prev ? { ...prev, responded_at: new Date().toISOString() } : null
        );
      }

      toast.success("Marked as responded");
    } catch (error) {
      console.error("Error updating submission:", error);
      toast.error("Failed to update submission");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this submission?")) return;

    try {
      const { error } = await supabase
        .from("contact_submissions")
        .delete()
        .eq("id", id);

      if (error) throw error;

      setSubmissions(prev => prev.filter(s => s.id !== id));
      setDialogOpen(false);
      toast.success("Submission deleted");
    } catch (error) {
      console.error("Error deleting submission:", error);
      toast.error("Failed to delete submission");
    }
  };

  const unreadCount = submissions.filter(s => !s.read).length;

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-32">
          <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Contact Submissions
                {unreadCount > 0 && (
                  <Badge variant="destructive" className="ml-2">
                    {unreadCount} new
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>
                Manage messages from the contact form
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={fetchSubmissions}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {submissions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No contact submissions yet
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Status</TableHead>
                  <TableHead>From</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {submissions.map((submission) => (
                  <TableRow 
                    key={submission.id}
                    className={!submission.read ? "bg-primary/5" : ""}
                  >
                    <TableCell>
                      {submission.responded_at ? (
                        <Badge variant="outline" className="text-primary border-primary">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Responded
                        </Badge>
                      ) : submission.read ? (
                        <Badge variant="outline">
                          <Eye className="h-3 w-3 mr-1" />
                          Read
                        </Badge>
                      ) : (
                        <Badge variant="default">
                          <Clock className="h-3 w-3 mr-1" />
                          New
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{submission.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {submission.email}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {submission.subject}
                    </TableCell>
                    <TableCell>
                      {format(new Date(submission.created_at), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewSubmission(submission)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleDelete(submission.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedSubmission?.subject}</DialogTitle>
            <DialogDescription>
              From {selectedSubmission?.name} ({selectedSubmission?.email})
            </DialogDescription>
          </DialogHeader>
          
          {selectedSubmission && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                Received: {format(new Date(selectedSubmission.created_at), "PPpp")}
              </div>
              
              <div className="bg-muted/50 rounded-lg p-4">
                <p className="whitespace-pre-wrap">{selectedSubmission.message}</p>
              </div>

              <div className="flex items-center justify-between pt-4 border-t">
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    onClick={() => window.open(`mailto:${selectedSubmission.email}?subject=Re: ${selectedSubmission.subject}`, "_blank")}
                  >
                    <Mail className="h-4 w-4 mr-2" />
                    Reply via Email
                  </Button>
                  {!selectedSubmission.responded_at && (
                    <Button
                      variant="outline"
                      onClick={() => handleMarkResponded(selectedSubmission.id)}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Mark as Responded
                    </Button>
                  )}
                </div>
                <Button
                  variant="destructive"
                  onClick={() => handleDelete(selectedSubmission.id)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ContactSubmissions;
