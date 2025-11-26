import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Loader2, User, Mail, Phone, MapPin, ShieldCheck } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { getUserRole } from "@/lib/supabase";

const Settings = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [changingEmail, setChangingEmail] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [newEmail, setNewEmail] = useState("");
  const [profile, setProfile] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
  });

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          navigate("/auth");
          return;
        }

        // Get user role
        const role = await getUserRole(session.user.id);
        setUserRole(role);

        // Get profile data
        const { data: profileData, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", session.user.id)
          .single();

        if (error) throw error;

        setProfile({
          name: profileData.name || "",
          email: session.user.email || "",
          phone: profileData.phone || "",
          address: profileData.address || "",
        });
      } catch (error: any) {
        toast.error("Failed to load profile");
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast.error("Not authenticated");
        return;
      }

      const { error } = await supabase
        .from("profiles")
        .update({
          name: profile.name,
          phone: profile.phone,
          address: profile.address,
        })
        .eq("id", session.user.id);

      if (error) throw error;

      toast.success("Profile updated successfully!");
    } catch (error: any) {
      toast.error(error.message || "Failed to update profile");
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const handleEmailChange = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setChangingEmail(true);

    try {
      if (!newEmail || newEmail === profile.email) {
        toast.error("Please enter a different email address");
        return;
      }

      const { error } = await supabase.auth.updateUser({
        email: newEmail,
      });

      if (error) throw error;

      toast.success("Verification email sent! Please check both your old and new email addresses to confirm the change.");
      setNewEmail("");
    } catch (error: any) {
      toast.error(error.message || "Failed to update email");
      console.error(error);
    } finally {
      setChangingEmail(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="container max-w-2xl mx-auto py-8 px-4 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Profile Settings</CardTitle>
            <CardDescription>
              Update your profile information
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {userRole === "admin" && (
                <div className="space-y-2">
                  <Label htmlFor="name">Username</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="name"
                      type="text"
                      value={profile.name}
                      onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                      className="pl-10"
                      placeholder="Enter your username"
                      required
                    />
                  </div>
                </div>
              )}

              {userRole !== "admin" && (
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="name"
                      type="text"
                      value={profile.name}
                      onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                      className="pl-10"
                      placeholder="Enter your name"
                      required
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="current-email">Current Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="current-email"
                    type="email"
                    value={profile.email}
                    className="pl-10 bg-muted"
                    disabled
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Your current email address
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="phone"
                    type="tel"
                    value={profile.phone}
                    onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                    className="pl-10"
                    placeholder="Enter your phone number"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="address"
                    type="text"
                    value={profile.address}
                    onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                    className="pl-10"
                    placeholder="Enter your address"
                  />
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-primary" />
              Change Email Address
            </CardTitle>
            <CardDescription>
              Update your email address. You'll need to verify both your old and new email addresses for security.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleEmailChange} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="new-email">New Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="new-email"
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    className="pl-10"
                    placeholder="Enter new email address"
                    required
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  A verification email will be sent to both your current and new email addresses
                </p>
              </div>

              <Separator />

              <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                <p className="text-sm font-medium">Important Security Notice:</p>
                <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
                  <li>Verification emails will be sent to both addresses</li>
                  <li>You must confirm the change from both email accounts</li>
                  <li>Your email won't change until verification is complete</li>
                  <li>Check your spam folder if you don't see the emails</li>
                </ul>
              </div>

              <Button 
                type="submit" 
                className="w-full" 
                disabled={changingEmail || !newEmail}
              >
                {changingEmail ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending Verification...
                  </>
                ) : (
                  "Change Email Address"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Settings;
