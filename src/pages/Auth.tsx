import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Loader2, Shield, ShieldAlert, ShieldCheck } from "lucide-react";
import logo from "@/assets/cwamso-logo.png";

type PasswordStrength = "weak" | "medium" | "strong" | "very-strong";
type AuthView = "signin" | "signup" | "reset";

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
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordStrength, setPasswordStrength] = useState<PasswordStrength>("weak");
  const [isPasswordRecovery, setIsPasswordRecovery] = useState(false);
  const [referralCode, setReferralCode] = useState(searchParams.get("ref") || "");
  const initialView = searchParams.get("view") === "signup" ? "signup" : "signin";
  const [authView, setAuthView] = useState<AuthView>(initialView);

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPassword = e.target.value;
    setPassword(newPassword);
    setPasswordStrength(calculatePasswordStrength(newPassword));
  };

  const resetForm = () => {
    setPassword("");
    setConfirmPassword("");
    setPasswordStrength("weak");
    setResetSent(false);
  };

  const switchView = (view: AuthView) => {
    resetForm();
    setAuthView(view);
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

    if (password !== confirmPassword) {
      toast.error("Passwords do not match. Please try again.");
      return;
    }
    
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
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
      // Attempt sign in - account lock status is checked server-side via handle_failed_login
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        // Log failed attempt and check lock status server-side
        const { data: failResult } = await supabase.rpc('handle_failed_login', {
          user_email: email,
          failure_reason: error.message,
          ip_addr: null,
          user_agent_str: navigator.userAgent
        });

        const result = failResult as any;
        if (result?.locked) {
          // Generic message - don't reveal specific details
          toast.error(result.message || "Too many failed login attempts. Please try again later.");
        } else if (result?.remaining_attempts) {
          toast.error(`Invalid email or password. ${result.remaining_attempts} attempts remaining.`);
        } else {
          toast.error("Invalid email or password");
        }
        setLoading(false);
        return;
      }

      // Log successful login
      await supabase.rpc('handle_successful_login', {
        user_email: email,
        ip_addr: null,
        user_agent_str: navigator.userAgent
      });

      // Check if user is banned
      if (data.user) {
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("banned, banned_reason")
          .eq("id", data.user.id)
          .single();

        if (profileError) {
          console.error("Error checking ban status:", profileError);
        }

        if (profile?.banned) {
          await supabase.auth.signOut();
          const reason = profile.banned_reason 
            ? `Reason: ${profile.banned_reason}` 
            : "Contact support for more information.";
          toast.error(`Your account has been banned. ${reason}`);
          return;
        }
      }

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

  // If in password recovery mode, show update password form
  if (isPasswordRecovery) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/10 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div 
              className="inline-flex flex-col items-center justify-center cursor-pointer"
              onClick={() => navigate("/")}
            >
              <img src={logo} alt="CWaMSo Logo" className="h-20 w-auto mb-4" />
              <h1 className="text-3xl font-bold text-foreground mb-2">CWaMSo</h1>
            </div>
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
                  <PasswordInput
                    id="new-password"
                    name="password"
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
          <div 
            className="inline-flex flex-col items-center justify-center cursor-pointer"
            onClick={() => navigate("/")}
          >
            <img src={logo} alt="CWaMSo Logo" className="h-20 w-auto mb-4" />
            <h1 className="text-3xl font-bold text-foreground mb-2">CWaMSo</h1>
          </div>
          <p className="text-muted-foreground">Community Waste Management Software</p>
        </div>

        {/* Sign In View */}
        {authView === "signin" && (
          <Card className="animate-fade-in"key="signin">
            <CardHeader>
              <CardTitle>Log in to your account</CardTitle>
              <CardDescription>Welcome back! Sign in to continue</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signin-email">Email address</Label>
                  <Input
                    id="signin-email"
                    name="email"
                    type="email"
                    placeholder="your@email.com"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="signin-password">Password</Label>
                    <button
                      type="button"
                      onClick={() => switchView("reset")}
                      className="text-sm text-primary hover:underline"
                    >
                      Forgot?
                    </button>
                  </div>
                  <PasswordInput
                    id="signin-password"
                    name="password"
                    placeholder="Enter password"
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
                    "Log in"
                  )}
                </Button>
              </form>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">or</span>
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => switchView("signup")}
              >
                Sign up
              </Button>

              <p className="text-center text-sm text-muted-foreground">
                New to CWaMSo?{" "}
                <button
                  type="button"
                  onClick={() => switchView("signup")}
                  className="text-primary hover:underline font-medium"
                >
                  Create an account
                </button>
              </p>
            </CardContent>
          </Card>
        )}

        {/* Sign Up View */}
        {authView === "signup" && (
          <Card className="animate-fade-in" key="signup">
            <CardHeader>
              <CardTitle>Create your account</CardTitle>
              <CardDescription>Join CWaMSo to manage waste efficiently</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-name">Full Name</Label>
                  <Input
                    id="signup-name"
                    name="name"
                    type="text"
                    placeholder="Enter your full name"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email address</Label>
                  <Input
                    id="signup-email"
                    name="email"
                    type="email"
                    placeholder="Enter a valid email address"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-phone">Phone</Label>
                  <Input
                    id="signup-phone"
                    name="phone"
                    type="tel"
                    placeholder="Enter your phone number"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-address">Address</Label>
                  <Input
                    id="signup-address"
                    name="address"
                    type="text"
                    placeholder="Enter your residential address"
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
                      <SelectItem value="collector">Waste Collector</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <PasswordInput
                    id="signup-password"
                    name="password"
                    placeholder="Create a password"
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
                        Password strength: {passwordStrength}
                      </span>
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-confirm-password">Confirm Password</Label>
                  <PasswordInput
                    id="signup-confirm-password"
                    name="confirmPassword"
                    placeholder="Confirm your password"
                    minLength={8}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                  {confirmPassword && password !== confirmPassword && (
                    <p className="text-sm text-destructive">Passwords do not match</p>
                  )}
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
                  />
                </div>
                <div className="flex items-start space-x-2">
                  <Checkbox
                    id="terms"
                    name="terms"
                    required
                    className="mt-1"
                  />
                  <label
                    htmlFor="terms"
                    className="text-sm text-muted-foreground leading-relaxed cursor-pointer"
                  >
                    I agree to the{" "}
                    <a
                      href="/terms"
                      target="_blank"
                      className="text-primary hover:underline font-medium"
                    >
                      Terms of Service
                    </a>{" "}
                    and{" "}
                    <a
                      href="/privacy"
                      target="_blank"
                      className="text-primary hover:underline font-medium"
                    >
                      Privacy Policy
                    </a>
                  </label>
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating account...
                    </>
                  ) : (
                    "Sign up"
                  )}
                </Button>
              </form>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">or</span>
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => switchView("signin")}
              >
                Log in
              </Button>

              <p className="text-center text-sm text-muted-foreground">
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => switchView("signin")}
                  className="text-primary hover:underline font-medium"
                >
                  Sign in
                </button>
              </p>

              <p className="text-center text-sm text-muted-foreground">
                Forgot your password?{" "}
                <button
                  type="button"
                  onClick={() => switchView("reset")}
                  className="text-primary hover:underline font-medium"
                >
                  Reset it here
                </button>
              </p>
            </CardContent>
          </Card>
        )}

        {/* Reset Password View */}
        {authView === "reset" && (
          <Card className="animate-fade-in" key="reset">
            <CardHeader>
              <CardTitle>Reset your password</CardTitle>
              <CardDescription>
                {resetSent
                  ? "Check your email for the reset link"
                  : "Enter your email to receive a password reset link"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {!resetSent ? (
                <form onSubmit={handlePasswordReset} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="reset-email">Email address</Label>
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
                      "Send reset link"
                    )}
                  </Button>
                </form>
              ) : (
                <div className="text-center py-4">
                  <p className="text-muted-foreground mb-4">
                    We've sent a password reset link to your email address.
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setResetSent(false);
                    }}
                  >
                    Send again
                  </Button>
                </div>
              )}

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">or</span>
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => switchView("signin")}
              >
                Back to login
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Auth;
