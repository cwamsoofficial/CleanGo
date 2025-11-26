import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, Shield, ShieldAlert, ShieldCheck, ArrowLeft } from "lucide-react";
import logo from "@/assets/cwamso-logo.png";

type PasswordStrength = "weak" | "medium" | "strong" | "very-strong";

const calculatePasswordStrength = (password: string): PasswordStrength => {
  let strength = 0;
  
  if (password.length >= 8) strength++;
  if (password.length >= 12) strength++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
  if (/\d/.test(password)) strength++;
  if (/[^a-zA-Z0-9]/.test(password)) strength++;
  
  if (strength <= 2) return "weak";
  if (strength === 3) return "medium";
  if (strength === 4) return "strong";
  return "very-strong";
};

const getPasswordStrengthColor = (strength: PasswordStrength) => {
  switch (strength) {
    case "weak": return "text-destructive";
    case "medium": return "text-yellow-500";
    case "strong": return "text-blue-500";
    case "very-strong": return "text-primary";
  }
};

const getPasswordStrengthIcon = (strength: PasswordStrength) => {
  switch (strength) {
    case "weak": return ShieldAlert;
    case "medium": return Shield;
    case "strong": return ShieldCheck;
    case "very-strong": return ShieldCheck;
  }
};

const AdminSignup = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [password, setPassword] = useState("");
  const [passwordStrength, setPasswordStrength] = useState<PasswordStrength>("weak");

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPassword = e.target.value;
    setPassword(newPassword);
    setPasswordStrength(calculatePasswordStrength(newPassword));
  };

  useEffect(() => {
    // Check if user is already logged in
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate("/admin");
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) {
        navigate("/admin");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleAdminSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (passwordStrength === "weak") {
      toast.error("Password is too weak. Please create a stronger password.");
      return;
    }
    
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    try {
      // Create the admin account
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            role: 'admin',
          },
          emailRedirectTo: `${window.location.origin}/admin`,
        },
      });

      if (error) {
        if (error.message.includes("already registered")) {
          toast.error("This email is already registered");
        } else {
          toast.error(error.message);
        }
        setLoading(false);
        return;
      }

      toast.success("Admin account created successfully! Logging you in...");
      // Auth state change listener will handle navigation
    } catch (error: any) {
      toast.error(error.message || "Failed to create admin account");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/10 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center mb-4">
            <img src={logo} alt="CWaMSo Logo" className="h-20 w-auto" />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">CWaMSo</h1>
          <p className="text-muted-foreground">Community Waste Management Software</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Admin Registration</CardTitle>
            <CardDescription>
              Create your administrator account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAdminSignUp} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="admin-email">Email</Label>
                <Input
                  id="admin-email"
                  name="email"
                  type="email"
                  placeholder="your@email.com"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="admin-password">Password</Label>
                <Input
                  id="admin-password"
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  minLength={8}
                  required
                  value={password}
                  onChange={handlePasswordChange}
                />
                {password && (
                  <div className="flex items-center gap-2 text-sm">
                    {(() => {
                      const Icon = getPasswordStrengthIcon(passwordStrength);
                      return <Icon className={`w-4 h-4 ${getPasswordStrengthColor(passwordStrength)}`} />;
                    })()}
                    <span className={getPasswordStrengthColor(passwordStrength)}>
                      Password strength: <span className="font-semibold capitalize">{passwordStrength.replace("-", " ")}</span>
                    </span>
                  </div>
                )}
                <p className="text-xs text-muted-foreground">
                  Use 8+ characters with uppercase, lowercase, numbers, and symbols
                </p>
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating Account...
                  </>
                ) : (
                  "Create Admin Account"
                )}
              </Button>
              <div className="text-center pt-2">
                <Link to="/admin/login" className="text-sm text-muted-foreground hover:text-primary inline-flex items-center gap-1">
                  <ArrowLeft className="w-4 h-4" />
                  Back to Admin Login
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminSignup;
