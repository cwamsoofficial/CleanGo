import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Key, ShieldAlert, Calendar, Hash, Copy, CheckCircle, XCircle } from "lucide-react";

interface AdminKey {
  id: string;
  status: string;
  expires_at: string | null;
  max_uses: number | null;
  current_uses: number;
  created_at: string;
  notes: string | null;
}

interface KeyAttempt {
  id: string;
  email: string;
  ip_address: string | null;
  success: boolean;
  created_at: string;
  error_reason: string | null;
}

const AdminKeyManagement = () => {
  const [keys, setKeys] = useState<AdminKey[]>([]);
  const [attempts, setAttempts] = useState<KeyAttempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  // Form state for new key generation
  const [expiresInDays, setExpiresInDays] = useState<string>("");
  const [maxUses, setMaxUses] = useState<string>("");
  const [notes, setNotes] = useState<string>("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch admin keys
      const { data: keysData, error: keysError } = await supabase
        .from("admin_keys")
        .select("*")
        .order("created_at", { ascending: false });

      if (keysError) throw keysError;
      setKeys(keysData || []);

      // Fetch validation attempts
      const { data: attemptsData, error: attemptsError } = await supabase
        .from("admin_key_attempts")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);

      if (attemptsError) throw attemptsError;
      setAttempts(attemptsData || []);
    } catch (error) {
      console.error("Error fetching admin key data:", error);
      toast.error("Failed to load admin key data");
    } finally {
      setLoading(false);
    }
  };

  const generateNewKey = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Generate a random key (16 characters, alphanumeric)
      const rawKey = Array.from({ length: 16 }, () => 
        'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'[Math.floor(Math.random() * 36)]
      ).join('');

      // Hash the key for storage
      const encoder = new TextEncoder();
      const data = encoder.encode(rawKey);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const keyHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

      // Calculate expiration date
      let expiresAt = null;
      if (expiresInDays && parseInt(expiresInDays) > 0) {
        const date = new Date();
        date.setDate(date.getDate() + parseInt(expiresInDays));
        expiresAt = date.toISOString();
      }

      // Insert the key
      const { error } = await supabase
        .from("admin_keys")
        .insert([{
          key_hash: keyHash,
          status: 'active',
          expires_at: expiresAt,
          max_uses: maxUses ? parseInt(maxUses) : null,
          current_uses: 0,
          created_by: user.id,
          notes: notes || null,
        }]);

      if (error) throw error;

      setGeneratedKey(rawKey);
      toast.success("Admin key generated successfully");
      fetchData();

      // Reset form
      setExpiresInDays("");
      setMaxUses("");
      setNotes("");
    } catch (error) {
      console.error("Error generating admin key:", error);
      toast.error("Failed to generate admin key");
    }
  };

  const revokeKey = async (keyId: string) => {
    try {
      const { error } = await supabase
        .from("admin_keys")
        .update({ status: 'revoked' })
        .eq("id", keyId);

      if (error) throw error;

      toast.success("Admin key revoked successfully");
      fetchData();
    } catch (error) {
      console.error("Error revoking key:", error);
      toast.error("Failed to revoke admin key");
    }
  };

  const copyToClipboard = () => {
    if (generatedKey) {
      navigator.clipboard.writeText(generatedKey);
      setCopied(true);
      toast.success("Admin key copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setGeneratedKey(null);
    setCopied(false);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-600">Active</Badge>;
      case 'expired':
        return <Badge className="bg-yellow-600">Expired</Badge>;
      case 'revoked':
        return <Badge className="bg-red-600">Revoked</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading admin key management...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Admin Key Management</h2>
          <p className="text-muted-foreground mt-1">
            Generate, manage, and monitor admin access keys
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Key className="mr-2 h-4 w-4" />
              Generate New Key
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Generate Admin Key</DialogTitle>
              <DialogDescription>
                Create a new admin key with custom expiration and usage limits
              </DialogDescription>
            </DialogHeader>
            
            {generatedKey ? (
              <div className="space-y-4 py-4">
                <div className="flex items-center gap-2 p-4 bg-muted rounded-lg">
                  <ShieldAlert className="h-5 w-5 text-destructive flex-shrink-0" />
                  <p className="text-sm text-foreground">
                    <strong>Important:</strong> Copy this key now. It won't be shown again.
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label>Admin Key</Label>
                  <div className="flex gap-2">
                    <Input
                      value={generatedKey}
                      readOnly
                      className="font-mono"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={copyToClipboard}
                    >
                      {copied ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="expires">Expires In (Days)</Label>
                  <Input
                    id="expires"
                    type="number"
                    placeholder="Leave empty for no expiration"
                    value={expiresInDays}
                    onChange={(e) => setExpiresInDays(e.target.value)}
                    min="1"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="maxUses">Max Uses</Label>
                  <Input
                    id="maxUses"
                    type="number"
                    placeholder="Leave empty for unlimited"
                    value={maxUses}
                    onChange={(e) => setMaxUses(e.target.value)}
                    min="1"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="notes">Notes (Optional)</Label>
                  <Textarea
                    id="notes"
                    placeholder="Add notes about this key..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                  />
                </div>
              </div>
            )}
            
            <DialogFooter>
              {generatedKey ? (
                <Button onClick={closeDialog}>Done</Button>
              ) : (
                <>
                  <Button variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={generateNewKey}>Generate Key</Button>
                </>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="keys" className="w-full">
        <TabsList>
          <TabsTrigger value="keys">Admin Keys</TabsTrigger>
          <TabsTrigger value="attempts">Validation Attempts</TabsTrigger>
        </TabsList>

        <TabsContent value="keys" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Active Admin Keys</CardTitle>
              <CardDescription>
                Manage admin access keys and their permissions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Expires</TableHead>
                    <TableHead>Usage</TableHead>
                    <TableHead>Notes</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {keys.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground">
                        No admin keys found
                      </TableCell>
                    </TableRow>
                  ) : (
                    keys.map((key) => (
                      <TableRow key={key.id}>
                        <TableCell>{getStatusBadge(key.status)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            {new Date(key.created_at).toLocaleDateString()}
                          </div>
                        </TableCell>
                        <TableCell>
                          {key.expires_at ? (
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              {new Date(key.expires_at).toLocaleDateString()}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">Never</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Hash className="h-4 w-4 text-muted-foreground" />
                            {key.current_uses}/{key.max_uses || "∞"}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-muted-foreground">
                            {key.notes || "—"}
                          </span>
                        </TableCell>
                        <TableCell>
                          {key.status === 'active' && (
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => revokeKey(key.id)}
                            >
                              Revoke
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="attempts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Validation Attempts</CardTitle>
              <CardDescription>
                Monitor all admin key validation attempts (last 50)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Status</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>IP Address</TableHead>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>Error Reason</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {attempts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground">
                        No validation attempts found
                      </TableCell>
                    </TableRow>
                  ) : (
                    attempts.map((attempt) => (
                      <TableRow key={attempt.id}>
                        <TableCell>
                          {attempt.success ? (
                            <Badge className="bg-green-600">
                              <CheckCircle className="mr-1 h-3 w-3" />
                              Success
                            </Badge>
                          ) : (
                            <Badge className="bg-red-600">
                              <XCircle className="mr-1 h-3 w-3" />
                              Failed
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="font-medium">
                          {attempt.email}
                        </TableCell>
                        <TableCell>
                          <span className="font-mono text-sm">
                            {attempt.ip_address || "—"}
                          </span>
                        </TableCell>
                        <TableCell>
                          {new Date(attempt.created_at).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-muted-foreground">
                            {attempt.error_reason || "—"}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminKeyManagement;
