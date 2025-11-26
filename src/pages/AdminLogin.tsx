import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { getUserRole } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const AdminLogin = () => {
  const [adminKey, setAdminKey] = useState("");
  const [keyValidated, setKeyValidated] = useState(false);
  const [keyLoading, setKeyLoading] = useState(false);
  const [keyError, setKeyError] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resetEmail, setResetEmail] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState("");
  const [resetSuccess, setResetSuccess] = useState(false);
  const [showResetDialog, setShowResetDialog] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleKeyValidation = async () => {
    if (!adminKey.trim()) {
      setKeyError("Please enter an admin key");
      return;
    }

    setKeyLoading(true);
    setKeyError("");

    try {
      const { data, error: validateError } = await supabase.rpc('validate_admin_key', {
        input_key: adminKey,
        user_email: email || 'unknown',
        user_ip: null
      });

      if (validateError) throw validateError;

      const result = data as { valid: boolean; message: string };

      if (!result.valid) {
        setKeyError(result.message || "Invalid admin key");
        return;
      }

      setKeyValidated(true);
      toast({
        title: "Success",
        description: "Admin key validated successfully",
      });
    } catch (err: any) {
      console.error("Key validation error:", err);
      setKeyError(err.message || "Failed to validate admin key");
    } finally {
      setKeyLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setError("Please enter both email and password");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) throw signInError;

      if (!data.user) {
        throw new Error("Login failed");
      }

      // Check if user is an admin
      const role = await getUserRole(data.user.id);
      
      if (role !== 'admin') {
        await supabase.auth.signOut();
        setError("Access denied. This login is for administrators only.");
        return;
      }

      // Check if user is banned
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
        setError(`Your account has been banned. ${reason}`);
        return;
      }

      toast({
        title: "Success",
        description: "Logged in successfully",
      });
      navigate("/dashboard/admin");
    } catch (err: any) {
      console.error("Login error:", err);
      if (err.message === "Invalid login credentials") {
        setError("Invalid email or password");
      } else {
        setError(err.message || "Failed to log in. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!resetEmail.trim()) {
      setResetError("Please enter your email address");
      return;
    }

    setResetLoading(true);
    setResetError("");
    setResetSuccess(false);

    try {
      const redirectUrl = `${window.location.origin}/admin/reset-password`;
      
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: redirectUrl,
      });

      if (resetError) throw resetError;

      setResetSuccess(true);
      toast({
        title: "Email Sent",
        description: "Check your email for password reset instructions",
      });

      // Close dialog after 2 seconds
      setTimeout(() => {
        setShowResetDialog(false);
        setResetEmail("");
        setResetSuccess(false);
      }, 2000);
    } catch (err: any) {
      console.error("Password reset request error:", err);
      setResetError(err.message || "Failed to send reset email. Please try again.");
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-primary/10 rounded-full">
              <Shield className="h-8 w-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl">Admin Access</CardTitle>
          <CardDescription>
            {keyValidated ? "Sign in with your admin credentials" : "Enter admin key to continue"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!keyValidated ? (
            <>
              {keyError && (
                <Alert variant="destructive">
                  <AlertDescription>{keyError}</AlertDescription>
                </Alert>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="adminKey">Admin Key</Label>
                <Input
                  id="adminKey"
                  type="password"
                  placeholder="Enter admin key"
                  value={adminKey}
                  onChange={(e) => setAdminKey(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleKeyValidation()}
                  disabled={keyLoading}
                />
              </div>

              <Button
                onClick={handleKeyValidation}
                disabled={keyLoading}
                className="w-full"
              >
                {keyLoading ? "Validating..." : "Validate Key"}
              </Button>

              <div className="text-center pt-2">
                <p className="text-sm text-muted-foreground">
                  Don't have an admin account?{" "}
                  <Link to="/admin/signup" className="text-primary hover:underline font-medium">
                    Sign up here
                  </Link>
                </p>
              </div>
            </>
          ) : (
            <>
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <PasswordInput
                  id="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                  disabled={loading}
                />
              </div>

              <Button
                onClick={handleLogin}
                disabled={loading}
                className="w-full"
              >
                {loading ? "Signing in..." : "Sign In"}
              </Button>

          <div className="text-center">
            <Dialog open={showResetDialog} onOpenChange={setShowResetDialog}>
              <DialogTrigger asChild>
                <Button variant="link" className="text-sm">
                  Forgot password?
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Reset Password</DialogTitle>
                  <DialogDescription>
                    Enter your email address and we'll send you a link to reset your password
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4 py-4">
                  {resetError && (
                    <Alert variant="destructive">
                      <AlertDescription>{resetError}</AlertDescription>
                    </Alert>
                  )}

                  {resetSuccess && (
                    <Alert className="border-green-500 bg-green-50 dark:bg-green-950">
                      <AlertDescription className="text-green-600">
                        Password reset email sent! Check your inbox.
                      </AlertDescription>
                    </Alert>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="resetEmail">Email</Label>
                    <Input
                      id="resetEmail"
                      type="email"
                      placeholder="admin@example.com"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleForgotPassword()}
                      disabled={resetLoading}
                    />
                  </div>

                  <Button
                    onClick={handleForgotPassword}
                    disabled={resetLoading}
                    className="w-full"
                  >
                    {resetLoading ? "Sending..." : "Send Reset Link"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

              <div className="text-center pt-2">
                <p className="text-sm text-muted-foreground">
                  Don't have an admin account?{" "}
                  <Link to="/admin/signup" className="text-primary hover:underline font-medium">
                    Sign up here
                  </Link>
                </p>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminLogin;
