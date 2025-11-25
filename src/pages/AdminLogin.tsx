import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const AdminLogin = () => {
  const [adminKey, setAdminKey] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleValidateKey = async () => {
    if (!adminKey.trim()) {
      setError("Please enter an admin key");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const { data, error: rpcError } = await supabase.rpc("validate_admin_key", {
        input_key: adminKey,
        user_email: "admin-login",
        user_ip: "127.0.0.1",
      } as any);

      if (rpcError) throw rpcError;

      const result = data as { valid: boolean; error?: string; message: string };

      if (result.valid) {
        toast({
          title: "Success",
          description: "Admin key validated successfully",
        });
        navigate("/dashboard/admin");
      } else {
        setError(result.message || "Invalid admin key");
      }
    } catch (err) {
      console.error("Admin key validation error:", err);
      setError("Failed to validate admin key. Please try again.");
    } finally {
      setLoading(false);
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
            Enter your admin key to access the admin dashboard
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
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
              onKeyDown={(e) => e.key === "Enter" && handleValidateKey()}
              disabled={loading}
            />
          </div>

          <Button
            onClick={handleValidateKey}
            disabled={loading}
            className="w-full"
          >
            {loading ? "Validating..." : "Validate Key"}
          </Button>

          <div className="text-center pt-2">
            <p className="text-sm text-muted-foreground">
              Don't have an admin account?{" "}
              <Link to="/admin/signup" className="text-primary hover:underline font-medium">
                Sign up here
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminLogin;
