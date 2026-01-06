import { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { format } from "date-fns";
import { AlertCircle, CheckCircle, Clock, Download, Edit, Eye, Hand, Loader2, Trash2, X, ZoomIn } from "lucide-react";

interface Issue {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'resolved';
  location: string | null;
  image_url: string | null;
  reporter_id: string;
  assigned_collector_id: string | null;
  created_at: string;
  resolved_at: string | null;
  rating: number | null;
}

interface IssueStats {
  total: number;
  pending: number;
  in_progress: number;
  resolved: number;
}

interface IssueRequest {
  id: string;
  issue_id: string;
  collector_id: string;
  status: string;
}

export default function Issues() {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [availableIssues, setAvailableIssues] = useState<Issue[]>([]);
  const [stats, setStats] = useState<IssueStats>({ total: 0, pending: 0, in_progress: 0, resolved: 0 });
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editForm, setEditForm] = useState({ title: '', description: '', location: '' });
  const [myRequests, setMyRequests] = useState<IssueRequest[]>([]);
  const [requestingIssue, setRequestingIssue] = useState<string | null>(null);

  useEffect(() => {
    fetchUserRole();
  }, []);

  useEffect(() => {
    if (userRole) {
      fetchIssues();
    }
  }, [userRole]);

  const fetchUserRole = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      setUserId(user.id);

      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      setUserRole(data.role);
    } catch (error) {
      console.error('Error fetching user role:', error);
      toast.error('Failed to fetch user role');
    }
  };

  const fetchIssues = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Citizens only see their own issues
      if (userRole === 'citizen' || userRole === 'company') {
        const { data, error } = await supabase
          .from('issue_reports')
          .select('*')
          .eq('reporter_id', user.id)
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        setIssues(data || []);
        
        const total = data?.length || 0;
        const pending = data?.filter(i => i.status === 'pending').length || 0;
        const in_progress = data?.filter(i => i.status === 'in_progress').length || 0;
        const resolved = data?.filter(i => i.status === 'resolved').length || 0;
        setStats({ total, pending, in_progress, resolved });
      } else if (userRole === 'collector') {
        // Collectors see their assigned issues
        const { data: assignedData, error: assignedError } = await supabase
          .from('issue_reports')
          .select('*')
          .eq('assigned_collector_id', user.id)
          .order('created_at', { ascending: false });

        if (assignedError) throw assignedError;
        setIssues(assignedData || []);

        // Fetch unassigned pending issues for the available tab
        const { data: availableData, error: availableError } = await supabase
          .from('issue_reports')
          .select('*')
          .is('assigned_collector_id', null)
          .eq('status', 'pending')
          .order('created_at', { ascending: false });

        if (availableError) throw availableError;
        setAvailableIssues(availableData || []);

        // Fetch collector's requests
        const { data: requestsData } = await supabase
          .from('issue_requests')
          .select('*')
          .eq('collector_id', user.id)
          .eq('status', 'pending');

        setMyRequests(requestsData || []);

        const total = assignedData?.length || 0;
        const pending = assignedData?.filter(i => i.status === 'pending').length || 0;
        const in_progress = assignedData?.filter(i => i.status === 'in_progress').length || 0;
        const resolved = assignedData?.filter(i => i.status === 'resolved').length || 0;
        setStats({ total, pending, in_progress, resolved });
      } else {
        // Admins see all issues
        const { data, error } = await supabase
          .from('issue_reports')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;
        setIssues(data || []);

        const total = data?.length || 0;
        const pending = data?.filter(i => i.status === 'pending').length || 0;
        const in_progress = data?.filter(i => i.status === 'in_progress').length || 0;
        const resolved = data?.filter(i => i.status === 'resolved').length || 0;
        setStats({ total, pending, in_progress, resolved });
      }
    } catch (error) {
      console.error('Error fetching issues:', error);
      toast.error('Failed to fetch issues');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestIssue = async (issueId: string) => {
    try {
      setRequestingIssue(issueId);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('issue_requests')
        .insert({
          issue_id: issueId,
          collector_id: user.id,
        });

      if (error) throw error;

      toast.success('Request submitted! Waiting for admin approval.');
      fetchIssues();
    } catch (error: any) {
      console.error('Error requesting issue:', error);
      toast.error(error.message || 'Failed to request issue');
    } finally {
      setRequestingIssue(null);
    }
  };

  const handleStatusUpdate = async (issueId: string, newStatus: 'pending' | 'in_progress' | 'resolved') => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const updateData: any = { status: newStatus };
      
      // If marking as resolved, set resolved_at timestamp
      if (newStatus === 'resolved') {
        updateData.resolved_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('issue_reports')
        .update(updateData)
        .eq('id', issueId);

      if (error) throw error;

      toast.success('Issue status updated successfully');
      fetchIssues();
    } catch (error) {
      console.error('Error updating issue:', error);
      toast.error('Failed to update issue status');
    }
  };

  const handleDelete = async (issueId: string) => {
    try {
      const { error } = await supabase
        .from('issue_reports')
        .delete()
        .eq('id', issueId);

      if (error) throw error;

      toast.success('Issue deleted successfully');
      setIsDialogOpen(false);
      setSelectedIssue(null);
      fetchIssues();
    } catch (error) {
      console.error('Error deleting issue:', error);
      toast.error('Failed to delete issue');
    }
  };

  const handleEditSubmit = async () => {
    if (!selectedIssue) return;
    
    try {
      const { error } = await supabase
        .from('issue_reports')
        .update({
          title: editForm.title,
          description: editForm.description,
          location: editForm.location || null,
        })
        .eq('id', selectedIssue.id);

      if (error) throw error;

      toast.success('Issue updated successfully');
      setIsEditMode(false);
      setIsDialogOpen(false);
      fetchIssues();
    } catch (error) {
      console.error('Error updating issue:', error);
      toast.error('Failed to update issue');
    }
  };

  const startEdit = (issue: Issue) => {
    setEditForm({
      title: issue.title,
      description: issue.description,
      location: issue.location || '',
    });
    setIsEditMode(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-500/10 text-yellow-700 dark:text-yellow-400"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case 'in_progress':
        return <Badge variant="outline" className="bg-blue-500/10 text-blue-700 dark:text-blue-400"><AlertCircle className="w-3 h-3 mr-1" />In Progress</Badge>;
      case 'resolved':
        return <Badge variant="outline" className="bg-green-500/10 text-green-700 dark:text-green-400"><CheckCircle className="w-3 h-3 mr-1" />Resolved</Badge>;
      default:
        return null;
    }
  };

  const fetchImageUrl = async (imagePath: string | null) => {
    if (!imagePath) {
      setImageUrl(null);
      return;
    }

    try {
      const { data } = await supabase.storage
        .from('issue-images')
        .createSignedUrl(imagePath, 3600); // 1 hour expiry

      if (data) {
        setImageUrl(data.signedUrl);
      }
    } catch (error) {
      console.error('Error fetching image URL:', error);
      setImageUrl(null);
    }
  };

  useEffect(() => {
    if (selectedIssue) {
      fetchImageUrl(selectedIssue.image_url);
    } else {
      setImageUrl(null);
    }
  }, [selectedIssue]);

  // Citizen/Company simple view
  if (userRole === 'citizen' || userRole === 'company') {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">My Reported Issues</h1>
            <p className="text-muted-foreground">View your submitted issue reports</p>
          </div>

          {/* Statistics Cards */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Reports</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-700 dark:text-yellow-400">{stats.pending}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">In Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-700 dark:text-blue-400">{stats.in_progress}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Resolved</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-700 dark:text-green-400">{stats.resolved}</div>
              </CardContent>
            </Card>
          </div>

          {/* Issues List */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Issues</CardTitle>
              <CardDescription>Your submitted issue reports</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">Loading issues...</div>
              ) : issues.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No issues reported yet
                </div>
              ) : (
                <div className="space-y-4">
                  {issues.map((issue) => (
                    <div
                      key={issue.id}
                      className="flex items-start justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                      onClick={() => {
                        setSelectedIssue(issue);
                        setIsDialogOpen(true);
                      }}
                    >
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium">{issue.title}</h3>
                          {getStatusBadge(issue.status)}
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {issue.description}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          {issue.location && <span>📍 {issue.location}</span>}
                          <span>{format(new Date(issue.created_at), 'MMM dd, yyyy')}</span>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm">
                        <Eye className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Issue Details Dialog for Citizens */}
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) setIsEditMode(false);
        }}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{isEditMode ? 'Edit Issue' : selectedIssue?.title}</DialogTitle>
              <DialogDescription>
                {isEditMode ? 'Update your issue report' : 'Issue details'}
              </DialogDescription>
            </DialogHeader>
            
            {selectedIssue && !isEditMode && (
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Status</h3>
                  {getStatusBadge(selectedIssue.status)}
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Description</h3>
                  <p className="text-muted-foreground">{selectedIssue.description}</p>
                </div>

                {selectedIssue.location && (
                  <div>
                    <h3 className="font-semibold mb-2">Location</h3>
                    <p className="text-muted-foreground">{selectedIssue.location}</p>
                  </div>
                )}

                {selectedIssue.image_url && imageUrl && (
                  <div>
                    <h3 className="font-semibold mb-2">Photo Evidence</h3>
                    <button 
                      onClick={() => setIsLightboxOpen(true)}
                      className="block cursor-pointer group w-full text-left"
                    >
                      <div className="relative">
                        <img 
                          src={imageUrl} 
                          alt="Issue evidence" 
                          className="w-full rounded-lg border transition-all hover:scale-[1.02] hover:shadow-lg"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors rounded-lg flex items-center justify-center">
                          <ZoomIn className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </div>
                    </button>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-semibold mb-2">Created</h3>
                    <p className="text-muted-foreground">
                      {format(new Date(selectedIssue.created_at), 'PPP')}
                    </p>
                  </div>

                  {selectedIssue.resolved_at && (
                    <div>
                      <h3 className="font-semibold mb-2">Resolved</h3>
                      <p className="text-muted-foreground">
                        {format(new Date(selectedIssue.resolved_at), 'PPP')}
                      </p>
                    </div>
                  )}
                </div>

                {/* Edit button for pending issues */}
                {selectedIssue.status === 'pending' && (
                  <div className="flex justify-end pt-4 border-t">
                    <Button variant="outline" onClick={() => startEdit(selectedIssue)}>
                      <Edit className="w-4 h-4 mr-2" />
                      Edit Issue
                    </Button>
                  </div>
                )}
              </div>
            )}

            {selectedIssue && isEditMode && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-title">Title</Label>
                  <Input
                    id="edit-title"
                    value={editForm.title}
                    onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-description">Description</Label>
                  <Textarea
                    id="edit-description"
                    value={editForm.description}
                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                    rows={4}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-location">Location</Label>
                  <Input
                    id="edit-location"
                    value={editForm.location}
                    onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                  />
                </div>
                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="outline" onClick={() => setIsEditMode(false)}>Cancel</Button>
                  <Button onClick={handleEditSubmit}>Save Changes</Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Lightbox Dialog */}
        <Dialog open={isLightboxOpen} onOpenChange={setIsLightboxOpen}>
          <DialogContent className="max-w-[90vw] max-h-[90vh] p-0 overflow-hidden">
            <button
              onClick={() => setIsLightboxOpen(false)}
              className="absolute top-4 right-4 z-50 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
            {imageUrl && (
              <img
                src={imageUrl}
                alt="Issue evidence full size"
                className="w-full h-full object-contain"
              />
            )}
          </DialogContent>
        </Dialog>
      </DashboardLayout>
    );
  }

  // Collector view with tabs
  if (userRole === 'collector') {
    const assignedActive = issues.filter(i => i.status !== 'resolved');
    const completedIssues = issues.filter(i => i.status === 'resolved');

    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Issue Reports</h1>
            <p className="text-muted-foreground">View and manage your assigned issues</p>
          </div>

          {/* Statistics Cards */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Assigned</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-700 dark:text-yellow-400">{stats.pending}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">In Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-700 dark:text-blue-400">{stats.in_progress}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Resolved</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-700 dark:text-green-400">{stats.resolved}</div>
              </CardContent>
            </Card>
          </div>

          {/* Tabs for Assigned / Available / Completed */}
          <Tabs defaultValue="assigned" className="w-full">
            <TabsList>
              <TabsTrigger value="assigned">Assigned ({assignedActive.length})</TabsTrigger>
              <TabsTrigger value="available">Available ({availableIssues.length})</TabsTrigger>
              <TabsTrigger value="completed">Completed ({completedIssues.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="assigned">
              <Card>
                <CardHeader>
                  <CardTitle>Assigned Issues</CardTitle>
                  <CardDescription>Issues assigned to you</CardDescription>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="text-center py-8">Loading...</div>
                  ) : assignedActive.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">No assigned issues</div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Title</TableHead>
                          <TableHead>Location</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Created</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {assignedActive.map((issue) => (
                          <TableRow key={issue.id}>
                            <TableCell>
                              <div>
                                <div className="font-medium">{issue.title}</div>
                                <div className="text-sm text-muted-foreground line-clamp-1">{issue.description}</div>
                              </div>
                            </TableCell>
                            <TableCell>{issue.location || 'N/A'}</TableCell>
                            <TableCell>{getStatusBadge(issue.status)}</TableCell>
                            <TableCell>{format(new Date(issue.created_at), 'MMM dd, yyyy')}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedIssue(issue);
                                    setIsDialogOpen(true);
                                  }}
                                >
                                  <Eye className="w-4 h-4 mr-1" />
                                  View
                                </Button>
                                <Select
                                  value={issue.status}
                                  onValueChange={(value) => handleStatusUpdate(issue.id, value as any)}
                                >
                                  <SelectTrigger className="w-[140px]">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="pending">Pending</SelectItem>
                                    <SelectItem value="in_progress">In Progress</SelectItem>
                                    <SelectItem value="resolved">Resolved</SelectItem>
                                  </SelectContent>
                                </Select>
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

            <TabsContent value="available">
              <Card>
                <CardHeader>
                  <CardTitle>Available Issues</CardTitle>
                  <CardDescription>Request to be assigned to unassigned issues</CardDescription>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="text-center py-8">Loading...</div>
                  ) : availableIssues.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">No available issues</div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Title</TableHead>
                          <TableHead>Location</TableHead>
                          <TableHead>Created</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {availableIssues.map((issue) => {
                          const existingRequest = myRequests.find(r => r.issue_id === issue.id);
                          return (
                            <TableRow key={issue.id}>
                              <TableCell>
                                <div>
                                  <div className="font-medium">{issue.title}</div>
                                  <div className="text-sm text-muted-foreground line-clamp-1">{issue.description}</div>
                                </div>
                              </TableCell>
                              <TableCell>{issue.location || 'N/A'}</TableCell>
                              <TableCell>{format(new Date(issue.created_at), 'MMM dd, yyyy')}</TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      setSelectedIssue(issue);
                                      setIsDialogOpen(true);
                                    }}
                                  >
                                    <Eye className="w-4 h-4 mr-1" />
                                    View
                                  </Button>
                                  {existingRequest ? (
                                    <Badge variant="outline">Request Pending</Badge>
                                  ) : (
                                    <Button
                                      size="sm"
                                      onClick={() => handleRequestIssue(issue.id)}
                                      disabled={requestingIssue === issue.id}
                                    >
                                      {requestingIssue === issue.id ? (
                                        <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                                      ) : (
                                        <Hand className="w-4 h-4 mr-1" />
                                      )}
                                      Request
                                    </Button>
                                  )}
                                </div>
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

            <TabsContent value="completed">
              <Card>
                <CardHeader>
                  <CardTitle>Completed Issues</CardTitle>
                  <CardDescription>Your resolved issues</CardDescription>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="text-center py-8">Loading...</div>
                  ) : completedIssues.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">No completed issues</div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Title</TableHead>
                          <TableHead>Location</TableHead>
                          <TableHead>Resolved</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {completedIssues.map((issue) => (
                          <TableRow key={issue.id}>
                            <TableCell>
                              <div>
                                <div className="font-medium">{issue.title}</div>
                                <div className="text-sm text-muted-foreground line-clamp-1">{issue.description}</div>
                              </div>
                            </TableCell>
                            <TableCell>{issue.location || 'N/A'}</TableCell>
                            <TableCell>{issue.resolved_at ? format(new Date(issue.resolved_at), 'MMM dd, yyyy') : 'N/A'}</TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedIssue(issue);
                                  setIsDialogOpen(true);
                                }}
                              >
                                <Eye className="w-4 h-4 mr-1" />
                                View
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
          </Tabs>
        </div>

        {/* Issue Details Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{selectedIssue?.title}</DialogTitle>
              <DialogDescription>Issue details</DialogDescription>
            </DialogHeader>
            {selectedIssue && (
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Status</h3>
                  {getStatusBadge(selectedIssue.status)}
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Description</h3>
                  <p className="text-muted-foreground">{selectedIssue.description}</p>
                </div>
                {selectedIssue.location && (
                  <div>
                    <h3 className="font-semibold mb-2">Location</h3>
                    <p className="text-muted-foreground">{selectedIssue.location}</p>
                  </div>
                )}
                {selectedIssue.image_url && imageUrl && (
                  <div>
                    <h3 className="font-semibold mb-2">Photo Evidence</h3>
                    <img src={imageUrl} alt="Issue evidence" className="w-full rounded-lg border" />
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-semibold mb-2">Created</h3>
                    <p className="text-muted-foreground">{format(new Date(selectedIssue.created_at), 'PPP')}</p>
                  </div>
                  {selectedIssue.resolved_at && (
                    <div>
                      <h3 className="font-semibold mb-2">Resolved</h3>
                      <p className="text-muted-foreground">{format(new Date(selectedIssue.resolved_at), 'PPP')}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Lightbox Modal */}
        <Dialog open={isLightboxOpen} onOpenChange={setIsLightboxOpen}>
          <DialogContent className="max-w-[95vw] max-h-[95vh] p-0 bg-black/95 border-none">
            <button
              onClick={() => setIsLightboxOpen(false)}
              className="absolute top-4 right-4 z-50 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
            >
              <X className="w-6 h-6 text-white" />
            </button>
            {imageUrl && (
              <div className="flex items-center justify-center w-full h-full p-4">
                <img src={imageUrl} alt="Issue evidence full size" className="max-w-full max-h-[85vh] object-contain rounded-lg" />
              </div>
            )}
          </DialogContent>
        </Dialog>
      </DashboardLayout>
    );
  }

  // Admin management view
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Issue Reports</h1>
          <p className="text-muted-foreground">View and manage reported issues</p>
        </div>

        {/* Statistics Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Issues</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-700 dark:text-yellow-400">{stats.pending}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-700 dark:text-blue-400">{stats.in_progress}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Resolved</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-700 dark:text-green-400">{stats.resolved}</div>
            </CardContent>
          </Card>
        </div>

        {/* Issues Table */}
        <Card data-tour="issue-list">
          <CardHeader>
            <CardTitle>Issue Reports</CardTitle>
            <CardDescription>Manage and track all reported issues</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">Loading issues...</div>
            ) : issues.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No issues found</div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {issues.map((issue) => (
                      <TableRow key={issue.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{issue.title}</div>
                            <div className="text-sm text-muted-foreground line-clamp-1">{issue.description}</div>
                          </div>
                        </TableCell>
                        <TableCell>{issue.location || 'N/A'}</TableCell>
                        <TableCell>{getStatusBadge(issue.status)}</TableCell>
                        <TableCell>{format(new Date(issue.created_at), 'MMM dd, yyyy')}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedIssue(issue);
                                setIsDialogOpen(true);
                              }}
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              View
                            </Button>
                            <Select
                              value={issue.status}
                              onValueChange={(value) => handleStatusUpdate(issue.id, value as any)}
                            >
                              <SelectTrigger className="w-[140px]">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="pending">Pending</SelectItem>
                                <SelectItem value="in_progress">In Progress</SelectItem>
                                <SelectItem value="resolved">Resolved</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Issue Details Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={(open) => {
        setIsDialogOpen(open);
        if (!open) setIsEditMode(false);
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isEditMode ? 'Edit Issue' : selectedIssue?.title}</DialogTitle>
            <DialogDescription>
              {isEditMode ? 'Update your issue report' : 'Issue details and information'}
            </DialogDescription>
          </DialogHeader>
          
          {selectedIssue && !isEditMode && (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Status</h3>
                {getStatusBadge(selectedIssue.status)}
              </div>

              <div>
                <h3 className="font-semibold mb-2">Description</h3>
                <p className="text-muted-foreground">{selectedIssue.description}</p>
              </div>

              {selectedIssue.location && (
                <div>
                  <h3 className="font-semibold mb-2">Location</h3>
                  <p className="text-muted-foreground">{selectedIssue.location}</p>
                </div>
              )}

              {selectedIssue.image_url && (
                <div>
                  <h3 className="font-semibold mb-2">Photo Evidence</h3>
                  {imageUrl ? (
                    <div className="space-y-3">
                      <button 
                        onClick={() => setIsLightboxOpen(true)}
                        className="block cursor-pointer group w-full text-left"
                      >
                        <div className="relative">
                          <img 
                            src={imageUrl} 
                            alt="Issue evidence" 
                            className="w-full rounded-lg border transition-all hover:scale-[1.02] hover:shadow-lg"
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors rounded-lg flex items-center justify-center">
                            <ZoomIn className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                        </div>
                      </button>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setIsLightboxOpen(true)}
                        >
                          <ZoomIn className="w-4 h-4 mr-2" />
                          View Full Size
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const link = document.createElement('a');
                            link.href = imageUrl;
                            link.download = `issue-evidence-${selectedIssue.id}.jpg`;
                            link.target = '_blank';
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                          }}
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Download
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-muted-foreground">Loading image...</p>
                  )}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold mb-2">Created</h3>
                  <p className="text-muted-foreground">
                    {format(new Date(selectedIssue.created_at), 'PPP')}
                  </p>
                </div>

                {selectedIssue.resolved_at && (
                  <div>
                    <h3 className="font-semibold mb-2">Resolved</h3>
                    <p className="text-muted-foreground">
                      {format(new Date(selectedIssue.resolved_at), 'PPP')}
                    </p>
                  </div>
                )}
              </div>

              {(userRole === 'collector' || userRole === 'admin') && (
                <div>
                  <h3 className="font-semibold mb-2">Update Status</h3>
                  <Select
                    value={selectedIssue.status}
                    onValueChange={(value) => {
                      handleStatusUpdate(selectedIssue.id, value as any);
                      setIsDialogOpen(false);
                    }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Action buttons */}
              <div className="flex gap-2 pt-4 border-t">
                {/* Edit button for citizens on their own pending reports */}
                {selectedIssue.reporter_id === userId && selectedIssue.status === 'pending' && (
                  <Button
                    variant="outline"
                    onClick={() => startEdit(selectedIssue)}
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Report
                  </Button>
                )}

                {/* Delete button for admins */}
                {userRole === 'admin' && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive">
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete Report
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Issue Report</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete this issue report? This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(selectedIssue.id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>
            </div>
          )}

          {/* Edit Form */}
          {selectedIssue && isEditMode && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-title">Title</Label>
                <Input
                  id="edit-title"
                  value={editForm.title}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  placeholder="Issue title"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  placeholder="Issue description"
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-location">Location</Label>
                <Input
                  id="edit-location"
                  value={editForm.location}
                  onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                  placeholder="Issue location"
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button onClick={handleEditSubmit}>
                  Save Changes
                </Button>
                <Button variant="outline" onClick={() => setIsEditMode(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Lightbox Modal */}
      <Dialog open={isLightboxOpen} onOpenChange={setIsLightboxOpen}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] p-0 bg-black/95 border-none">
          <button
            onClick={() => setIsLightboxOpen(false)}
            className="absolute top-4 right-4 z-50 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
          >
            <X className="w-6 h-6 text-white" />
          </button>
          {imageUrl && (
            <div className="flex items-center justify-center w-full h-full p-4">
              <img 
                src={imageUrl} 
                alt="Issue evidence full size" 
                className="max-w-full max-h-[85vh] object-contain rounded-lg"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
