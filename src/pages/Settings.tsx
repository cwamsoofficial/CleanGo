import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, User, Mail, Phone, MapPin, RotateCcw } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { getUserRole } from "@/lib/supabase";
import { useOnboarding } from "@/components/OnboardingTour";
import { useUserProfile } from "@/contexts/UserProfileContext";
import AvatarUpload from "@/components/AvatarUpload";

const Settings = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const { resetOnboarding } = useOnboarding();
  const { updateAvatar, updateName } = useUserProfile();
  const [profile, setProfile] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    avatar_url: "",
  });

  const handleRestartTour = () => {
    resetOnboarding();
    navigate("/dashboard");
    toast.success("Tour restarted! Redirecting to dashboard...");
  };

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

        setUserId(session.user.id);

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
          avatar_url: profileData.avatar_url || "",
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

      updateName(profile.name);
      toast.success("Profile updated successfully!");
    } catch (error: any) {
      toast.error(error.message || "Failed to update profile");
      console.error(error);
    } finally {
      setSaving(false);
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
            {/* Avatar Upload Section */}
            {userId && (
              <div className="pb-4 border-b">
                <AvatarUpload
                  userId={userId}
                  avatarUrl={profile.avatar_url}
                  userName={profile.name}
                  onAvatarChange={(url) => {
                    setProfile({ ...profile, avatar_url: url });
                    updateAvatar(url || null);
                  }}
                />
              </div>
            )}

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

        {/* Help & Tour Card */}
        <Card>
          <CardHeader>
            <CardTitle>Help & Tour</CardTitle>
            <CardDescription>
              Need a refresher on how to use CWaMSo?
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              variant="outline" 
              onClick={handleRestartTour}
              className="gap-2"
            >
              <RotateCcw className="h-4 w-4" />
              Restart Onboarding Tour
            </Button>
            <p className="text-sm text-muted-foreground mt-2">
              This will replay the interactive tour to help you navigate the platform.
            </p>
          </CardContent>
        </Card>

      </div>
    </DashboardLayout>
  );
};

export default Settings;
