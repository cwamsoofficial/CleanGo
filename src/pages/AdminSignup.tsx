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
  const [adminKey, setAdminKey] = useState("");
  const [adminKeyValidated, setAdminKeyValidated] = useState(false);
  const [adminKeyError, setAdminKeyError] = useState("");

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPassword = e.target.value;
    setPassword(newPassword);
    setPasswordStrength(calculatePasswordStrength(newPassword));
  };

  useEffect(() => {
    // Check if user is already logged in
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate("/dashboard");
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) {
        navigate("/dashboard");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleValidateAdminKey = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!adminKey.trim()) {
      setAdminKeyError("An Admin Key is required to create an administrator account.");
      return;
    }
    
    setLoading(true);
    setAdminKeyError("");

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;

    try {
      const { data, error } = await supabase.rpc('validate_admin_key', {
        input_key: adminKey,
        user_email: email,
        user_ip: "127.0.0.1"
      } as any);

      if (error) throw error;

      const result = data as { valid: boolean; error?: string; message: string };

      if (result.valid) {
        setAdminKeyValidated(true);
        toast.success("Admin Key validated successfully!");
      } else {
        setAdminKeyError(result.message);
        toast.error(result.message);
      }
    } catch (error: any) {
      setAdminKeyError("Failed to validate Admin Key. Please try again.");
      toast.error(error.message || "Failed to validate Admin Key");
    } finally {
      setLoading(false);
    }
  };

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
    const name = formData.get("name") as string;

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            role: 'admin',
          },
          emailRedirectTo: `${window.location.origin}/dashboard`,
        },
      });

      if (error) throw error;

      toast.success("Admin account created successfully! Logging you in...");
      setAdminKeyValidated(false);
      setAdminKey("");
    } catch (error: any) {
      toast.error(error.message || "Failed to create admin account");
    } finally {
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
              {adminKeyValidated
                ? "Complete your admin account setup"
                : "Admin Key required for authorization"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!adminKeyValidated ? (
              <form onSubmit={handleValidateAdminKey} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="admin-key">Admin Key</Label>
                  <Input
                    id="admin-key"
                    name="adminKey"
                    type="password"
                    placeholder="Enter your Admin Key"
                    required
                    value={adminKey}
                    onChange={(e) => setAdminKey(e.target.value)}
                  />
                  {adminKeyError && (
                    <p className="text-sm text-destructive">{adminKeyError}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Admin Keys are issued only to authorized personnel.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="admin-email-verify">Email</Label>
                  <Input
                    id="admin-email-verify"
                    name="email"
                    type="email"
                    placeholder="your@email.com"
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Validating...
                    </>
                  ) : (
                    "Validate Admin Key"
                  )}
                </Button>
                <div className="text-center pt-2">
                  <Link to="/admin/login" className="text-sm text-muted-foreground hover:text-primary inline-flex items-center gap-1">
                    <ArrowLeft className="w-4 h-4" />
                    Back to Admin Login
                  </Link>
                </div>
              </form>
            ) : (
              <form onSubmit={handleAdminSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="admin-name">Full Name</Label>
                  <Input
                    id="admin-name"
                    name="name"
                    type="text"
                    placeholder="John Doe"
                    required
                  />
                </div>
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
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      setAdminKeyValidated(false);
                      setAdminKey("");
                      setAdminKeyError("");
                    }}
                  >
                    Back
                  </Button>
                  <Button type="submit" className="flex-1" disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      "Create Admin Account"
                    )}
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminSignup;
