import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, Shield, ShieldAlert, ShieldCheck } from "lucide-react";
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

const Auth = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [password, setPassword] = useState("");
  const [passwordStrength, setPasswordStrength] = useState<PasswordStrength>("weak");
  const [isPasswordRecovery, setIsPasswordRecovery] = useState(false);
  const [referralCode, setReferralCode] = useState(searchParams.get("ref") || "");
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
      } else if (event === "PASSWORD_RECOVERY") {
        setIsPasswordRecovery(true);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
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
    const phone = formData.get("phone") as string;
    const address = formData.get("address") as string;
    const role = formData.get("role") as string;
    const referralCodeInput = formData.get("referralCode") as string;

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            phone,
            address,
            role,
          },
          emailRedirectTo: `${window.location.origin}/dashboard`,
        },
      });

      if (error) throw error;

      // If referral code provided, create referral record
      if (referralCodeInput && data.user) {
        const { data: referrerProfile } = await supabase
          .from('profiles')
          .select('id')
          .eq('referral_code', referralCodeInput.toUpperCase())
          .single();

        if (referrerProfile) {
          await supabase
            .from('user_referrals')
            .insert({
              referrer_id: referrerProfile.id,
              referred_user_id: data.user.id,
              referral_code: referralCodeInput.toUpperCase(),
              status: 'pending'
            });
        }
      }

      toast.success("Account created successfully! Logging you in...");
    } catch (error: any) {
      toast.error(error.message || "Failed to create account");
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      toast.success("Welcome back!");
    } catch (error: any) {
      toast.error(error.message || "Failed to sign in");
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth`,
      });

      if (error) throw error;

      setResetSent(true);
      toast.success("Password reset link sent to your email!");
    } catch (error: any) {
      toast.error(error.message || "Failed to send reset link");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (passwordStrength === "weak") {
      toast.error("Password is too weak. Please create a stronger password.");
      return;
    }
    
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const newPassword = formData.get("password") as string;

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      toast.success("Password updated successfully!");
      setIsPasswordRecovery(false);
      navigate("/dashboard");
    } catch (error: any) {
      toast.error(error.message || "Failed to update password");
    } finally {
      setLoading(false);
    }
  };

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
        _key: adminKey,
        _email: email,
        _ip_address: null
      });

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

  // If in password recovery mode, show update password form
  if (isPasswordRecovery) {
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
              <CardTitle>Update Your Password</CardTitle>
              <CardDescription>Enter your new password below</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpdatePassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="new-password">New Password</Label>
                  <Input
                    id="new-password"
                    name="password"
                    type="password"
                    placeholder="••••••••"
                    required
                    value={password}
                    onChange={handlePasswordChange}
                  />
                  <div className="flex items-center gap-2 text-sm">
                    {(() => {
                      const Icon = getPasswordStrengthIcon(passwordStrength);
                      return <Icon className={`w-4 h-4 ${getPasswordStrengthColor(passwordStrength)}`} />;
                    })()}
                    <span className={getPasswordStrengthColor(passwordStrength)}>
                      Password strength: {passwordStrength}
                    </span>
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    "Update Password"
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

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

        <Tabs defaultValue="signin" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="signin">Sign In</TabsTrigger>
            <TabsTrigger value="signup">Sign Up</TabsTrigger>
            <TabsTrigger value="admin">Admin</TabsTrigger>
            <TabsTrigger value="reset">Reset</TabsTrigger>
          </TabsList>

          <TabsContent value="signin">
            <Card>
              <CardHeader>
                <CardTitle>Welcome Back</CardTitle>
                <CardDescription>Sign in to your account to continue</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signin-email">Email</Label>
                    <Input
                      id="signin-email"
                      name="email"
                      type="email"
                      placeholder="your@email.com"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signin-password">Password</Label>
                    <Input
                      id="signin-password"
                      name="password"
                      type="password"
                      placeholder="••••••••"
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Signing in...
                      </>
                    ) : (
                      "Sign In"
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="signup">
            <Card>
              <CardHeader>
                <CardTitle>Create Account</CardTitle>
                <CardDescription>Join CWaMSo to manage waste efficiently</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-name">Full Name</Label>
                    <Input
                      id="signup-name"
                      name="name"
                      type="text"
                      placeholder="John Doe"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <Input
                      id="signup-email"
                      name="email"
                      type="email"
                      placeholder="your@email.com"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-phone">Phone</Label>
                    <Input
                      id="signup-phone"
                      name="phone"
                      type="tel"
                      placeholder="+1 (555) 000-0000"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-address">Address</Label>
                    <Input
                      id="signup-address"
                      name="address"
                      type="text"
                      placeholder="123 Main St, City, State"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-role">Role</Label>
                    <Select name="role" defaultValue="citizen" required>
                      <SelectTrigger>
                        <SelectValue placeholder="Select your role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="citizen">Citizen</SelectItem>
                        <SelectItem value="company">Company/Organization</SelectItem>
                        <SelectItem value="collector">Waste Collector</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Password</Label>
                    <Input
                      id="signup-password"
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
                  <div className="space-y-2">
                    <Label htmlFor="signup-referral">Referral Code (Optional)</Label>
                    <Input
                      id="signup-referral"
                      name="referralCode"
                      type="text"
                      placeholder="Enter referral code"
                      value={referralCode}
                      onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                      maxLength={8}
                    />
                    <p className="text-xs text-muted-foreground">
                      Have a referral code? Enter it to help your friend earn rewards!
                    </p>
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating account...
                      </>
                    ) : (
                      "Create Account"
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="admin">
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
          </TabsContent>

          <TabsContent value="reset">
            <Card>
              <CardHeader>
                <CardTitle>Reset Password</CardTitle>
                <CardDescription>
                  {resetSent
                    ? "Check your email for the reset link"
                    : "Enter your email to receive a reset link"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!resetSent ? (
                  <form onSubmit={handlePasswordReset} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="reset-email">Email</Label>
                      <Input
                        id="reset-email"
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
                          Sending...
                        </>
                      ) : (
                        "Send Reset Link"
                      )}
                    </Button>
                  </form>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-sm text-muted-foreground mb-4">
                      We've sent a password reset link to your email. Click the link to reset your password.
                    </p>
                    <Button
                      variant="outline"
                      onClick={() => setResetSent(false)}
                      className="w-full"
                    >
                      Send Another Link
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Auth;
