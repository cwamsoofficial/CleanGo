import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { toast } from "sonner";
import { Shield, KeyRound, Timer, Globe, Info, Loader2 } from "lucide-react";

interface SecuritySettingsState {
  max_failed_attempts: number;
  lockout_minutes: number;
  ip_max_attempts: number;
  ip_window_minutes: number;
  signup_enabled: boolean;
  password_hibp_enabled: boolean;
}

const DEFAULTS: SecuritySettingsState = {
  max_failed_attempts: 5,
  lockout_minutes: 30,
  ip_max_attempts: 20,
  ip_window_minutes: 15,
  signup_enabled: true,
  password_hibp_enabled: true,
};

const SecuritySettings = () => {
  const [settings, setSettings] = useState<SecuritySettingsState>(DEFAULTS);
  const [initial, setInitial] = useState<SecuritySettingsState>(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void load();
  }, []);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase.rpc("get_security_settings");
    if (error) {
      toast.error("Failed to load security settings");
      setLoading(false);
      return;
    }
    const merged: SecuritySettingsState = { ...DEFAULTS, ...(data as any) };
    setSettings(merged);
    setInitial(merged);
    setLoading(false);
  };

  const dirty = JSON.stringify(settings) !== JSON.stringify(initial);

  const update = <K extends keyof SecuritySettingsState>(key: K, value: SecuritySettingsState[K]) => {
    setSettings((s) => ({ ...s, [key]: value }));
  };

  const save = async () => {
    setSaving(true);
    const { data, error } = await supabase.rpc("admin_update_security_settings", {
      _settings: settings as any,
    });
    if (error) {
      toast.error(error.message || "Failed to save settings");
      setSaving(false);
      return;
    }
    const merged: SecuritySettingsState = { ...DEFAULTS, ...(data as any) };
    setSettings(merged);
    setInitial(merged);
    toast.success("Security settings updated");
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" /> Security Settings
          </CardTitle>
          <CardDescription>
            Configure password protection, throttling, and authentication policies.
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Account lockout */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <KeyRound className="w-4 h-4" /> Account Lockout
          </CardTitle>
          <CardDescription>
            Lock accounts after repeated failed sign-in attempts.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="max_failed">Max failed attempts</Label>
            <Input
              id="max_failed"
              type="number"
              min={3}
              max={20}
              value={settings.max_failed_attempts}
              onChange={(e) => update("max_failed_attempts", Number(e.target.value))}
            />
            <p className="text-xs text-muted-foreground">Between 3 and 20. Currently {initial.max_failed_attempts}.</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="lockout_minutes">Lockout duration (minutes)</Label>
            <Input
              id="lockout_minutes"
              type="number"
              min={1}
              max={1440}
              value={settings.lockout_minutes}
              onChange={(e) => update("lockout_minutes", Number(e.target.value))}
            />
            <p className="text-xs text-muted-foreground">Between 1 and 1440 (24h).</p>
          </div>
        </CardContent>
      </Card>

      {/* IP throttling */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Globe className="w-4 h-4" /> IP Throttling
          </CardTitle>
          <CardDescription>
            Rate-limit login attempts per IP address to slow brute-force attacks.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="ip_max">Max attempts per IP</Label>
            <Input
              id="ip_max"
              type="number"
              min={5}
              max={200}
              value={settings.ip_max_attempts}
              onChange={(e) => update("ip_max_attempts", Number(e.target.value))}
            />
            <p className="text-xs text-muted-foreground">Between 5 and 200.</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="ip_window">Window (minutes)</Label>
            <Input
              id="ip_window"
              type="number"
              min={1}
              max={240}
              value={settings.ip_window_minutes}
              onChange={(e) => update("ip_window_minutes", Number(e.target.value))}
            />
            <p className="text-xs text-muted-foreground">Rolling window used for the IP counter.</p>
          </div>
        </CardContent>
      </Card>

      {/* Password protection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Shield className="w-4 h-4" /> Password Protection
          </CardTitle>
          <CardDescription>
            Enforce protections on passwords used to sign up and change credentials.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <Label htmlFor="hibp">Leaked-password check (HIBP)</Label>
              <p className="text-xs text-muted-foreground">
                Reject passwords found in known data breaches.
              </p>
            </div>
            <Switch
              id="hibp"
              checked={settings.password_hibp_enabled}
              onCheckedChange={(v) => update("password_hibp_enabled", v)}
            />
          </div>
          <Separator />
          <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>Applied in auth provider</AlertTitle>
            <AlertDescription>
              HIBP enforcement runs on the auth server. Toggling here records your intent
              in the audit log. To apply the change on the provider, ask Lovable to run
              the auth configuration update.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Signups */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Timer className="w-4 h-4" /> Signups
          </CardTitle>
          <CardDescription>
            Allow or block new self-service registrations.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <Label htmlFor="signup">Public signups enabled</Label>
              <p className="text-xs text-muted-foreground">
                Turn off to hide signup forms across the app.
              </p>
            </div>
            <Switch
              id="signup"
              checked={settings.signup_enabled}
              onCheckedChange={(v) => update("signup_enabled", v)}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-end gap-2">
        <Button
          variant="outline"
          onClick={() => setSettings(initial)}
          disabled={!dirty || saving}
        >
          Discard
        </Button>
        <Button onClick={save} disabled={!dirty || saving}>
          {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          Save changes
        </Button>
      </div>
    </div>
  );
};

export default SecuritySettings;
