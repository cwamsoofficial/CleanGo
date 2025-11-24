import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Users, Copy, Check, Gift } from "lucide-react";
import { toast } from "sonner";

interface ReferralStats {
  referralCode: string;
  totalReferrals: number;
  pendingReferrals: number;
  completedReferrals: number;
  pointsEarned: number;
}

interface Referral {
  id: string;
  referred_user_id: string;
  status: string;
  created_at: string;
  completed_at: string | null;
  points_awarded: number;
}

export function ReferralSection() {
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [copied, setCopied] = useState(false);
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Users, Copy, CheckCircle, Clock, Gift } from "lucide-react";
import { toast } from "sonner";

interface ReferralData {
  id: string;
  referred_user_id: string;
  referral_code: string;
  status: "pending" | "completed";
  points_awarded: number | null;
  created_at: string;
  completed_at: string | null;
  referred_user_name?: string;
}

export const ReferralSection = () => {
  const [referralCode, setReferralCode] = useState<string>("");
  const [referrals, setReferrals] = useState<ReferralData[]>([]);
  const [totalEarned, setTotalEarned] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReferralData();
  }, []);

  const fetchReferralData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch user's referral code
      const { data: profile } = await supabase
        .from('profiles')
        .select('referral_code')
        .eq('id', user.id)
        .single();

      if (!profile?.referral_code) {
        setLoading(false);
        return;
      }

      // Fetch referrals made by this user
      const { data: referralsData, error: referralsError } = await supabase
        .from('user_referrals')
        .select('*')
        .eq('referrer_id', user.id)
        .order('created_at', { ascending: false });

      if (referralsError) throw referralsError;

      const totalReferrals = referralsData?.length || 0;
      const pendingReferrals = referralsData?.filter(r => r.status === 'pending').length || 0;
      const completedReferrals = referralsData?.filter(r => r.status === 'completed').length || 0;
      const pointsEarned = referralsData?.reduce((sum, r) => sum + (r.points_awarded || 0), 0) || 0;

      setStats({
        referralCode: profile.referral_code,
        totalReferrals,
        pendingReferrals,
        completedReferrals,
        pointsEarned
      });
      setReferrals(referralsData || []);
    } catch (error) {
      console.error('Error fetching referral data:', error);
      toast.error('Failed to load referral data');
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      // Get user's referral code
      const { data: profile } = await supabase
        .from("profiles")
        .select("referral_code")
        .eq("id", user.id)
        .single();

      if (profile) {
        setReferralCode(profile.referral_code || "");
      }

      // Get referrals made by this user
      const { data: referralsData } = await supabase
        .from("user_referrals")
        .select("*")
        .eq("referrer_id", user.id)
        .order("created_at", { ascending: false });

      if (referralsData) {
        // Fetch referred user names
        const referralsWithNames = await Promise.all(
          referralsData.map(async (ref) => {
            const { data: refProfile } = await supabase
              .from("profiles")
              .select("name")
              .eq("id", ref.referred_user_id)
              .single();

            return {
              ...ref,
              referred_user_name: refProfile?.name || "Unknown User",
            };
          })
        );

        setReferrals(referralsWithNames);

        // Calculate total earned from completed referrals
        const earned = referralsWithNames
          .filter((ref) => ref.status === "completed")
          .reduce((sum, ref) => sum + (ref.points_awarded || 0), 0);
        setTotalEarned(earned);
      }
    } catch (error) {
      toast.error("Failed to load referral data");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const copyReferralLink = () => {
    if (!stats) return;
    
    const referralUrl = `${window.location.origin}/auth?ref=${stats.referralCode}`;
    navigator.clipboard.writeText(referralUrl);
    setCopied(true);
    toast.success('Referral link copied to clipboard!');
    
    setTimeout(() => setCopied(false), 2000);
  };

  const copyReferralCode = () => {
    if (!stats) return;
    
    navigator.clipboard.writeText(stats.referralCode);
    setCopied(true);
    toast.success('Referral code copied!');
    
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-48">
          <p className="text-muted-foreground">Loading referral data...</p>
        </CardContent>
      </Card>
    );
  }

  if (!stats) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Referral Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Referrals</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalReferrals}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Users className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingReferrals}</div>
            <p className="text-xs text-muted-foreground">
              Waiting for first pickup
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <Users className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completedReferrals}</div>
            <p className="text-xs text-muted-foreground">
              Friends completed pickup
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Points Earned</CardTitle>
            <Gift className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₦{(stats.pointsEarned * 10).toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {stats.pointsEarned} points from referrals
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Share Referral */}
      <Card>
        <CardHeader>
          <CardTitle>Share Your Referral Link</CardTitle>
          <CardDescription>
            Invite friends to join CWaMSo and earn ₦1,000 when they complete their first pickup
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              value={`${window.location.origin}/auth?ref=${stats.referralCode}`}
              readOnly
              className="flex-1"
            />
            <Button onClick={copyReferralLink} variant="outline">
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
          
          <div className="pt-2 border-t">
            <p className="text-sm text-muted-foreground mb-2">Or share your referral code:</p>
            <div className="flex gap-2">
              <Input
                value={stats.referralCode}
                readOnly
                className="flex-1 font-mono text-lg"
              />
              <Button onClick={copyReferralCode} variant="outline">
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Referral History */}
      {referrals.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Referral History</CardTitle>
            <CardDescription>Track your referrals and their status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {referrals.map((referral) => (
                <div
                  key={referral.id}
                  className="flex items-center justify-between p-3 rounded-lg border bg-card"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${
                      referral.status === 'completed' ? 'bg-green-500' : 'bg-yellow-500'
                    }`} />
                    <div>
                      <p className="text-sm font-medium">
                        Referral {referral.status === 'completed' ? 'Completed' : 'Pending'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(referral.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  {referral.status === 'completed' && (
                    <div className="text-right">
                      <p className="text-sm font-bold text-primary">
                        +₦{(referral.points_awarded * 10).toLocaleString()}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(referral.completed_at!).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
    const referralLink = `${window.location.origin}/auth?ref=${referralCode}`;
    navigator.clipboard.writeText(referralLink);
    toast.success("Referral link copied to clipboard!");
  };

  const copyReferralCode = () => {
    navigator.clipboard.writeText(referralCode);
    toast.success("Referral code copied!");
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>;
  }

  const pendingReferrals = referrals.filter((r) => r.status === "pending");
  const completedReferrals = referrals.filter((r) => r.status === "completed");

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5 text-primary" />
            Your Referral Program
          </CardTitle>
          <CardDescription>
            Invite friends and earn ₦500 when they complete their first pickup
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Your Referral Code</Label>
            <div className="flex gap-2">
              <Input
                value={referralCode}
                readOnly
                className="font-mono text-lg font-bold"
              />
              <Button onClick={copyReferralCode} variant="outline" size="icon">
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Share Your Referral Link</Label>
            <div className="flex gap-2">
              <Input
                value={`${window.location.origin}/auth?ref=${referralCode}`}
                readOnly
                className="text-sm"
              />
              <Button onClick={copyReferralLink} size="sm">
                <Copy className="h-4 w-4 mr-2" />
                Copy Link
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 pt-4 border-t border-border">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{referrals.length}</div>
              <p className="text-xs text-muted-foreground">Total Referrals</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{completedReferrals.length}</div>
              <p className="text-xs text-muted-foreground">Completed</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">₦{(totalEarned * 10).toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Total Earned</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Your Referrals
          </CardTitle>
          <CardDescription>
            Track your friends' progress and rewards
          </CardDescription>
        </CardHeader>
        <CardContent>
          {referrals.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground">No referrals yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                Share your referral code to start earning rewards!
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {referrals.map((referral) => (
                <div
                  key={referral.id}
                  className="flex items-center justify-between p-4 border border-border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${
                      referral.status === "completed" 
                        ? "bg-green-500/10" 
                        : "bg-yellow-500/10"
                    }`}>
                      {referral.status === "completed" ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : (
                        <Clock className="h-5 w-5 text-yellow-600" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium">{referral.referred_user_name}</p>
                      <p className="text-xs text-muted-foreground">
                        Joined {new Date(referral.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    {referral.status === "completed" ? (
                      <>
                        <Badge className="bg-green-500/10 text-green-700 hover:bg-green-500/20">
                          Completed
                        </Badge>
                        <p className="text-sm font-bold text-primary mt-1">
                          +₦{((referral.points_awarded || 0) * 10).toLocaleString()}
                        </p>
                      </>
                    ) : (
                      <>
                        <Badge variant="secondary">Pending</Badge>
                        <p className="text-xs text-muted-foreground mt-1">
                          Waiting for first pickup
                        </p>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-secondary/10 to-secondary/5">
        <CardHeader>
          <CardTitle className="text-lg">How Referrals Work</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex items-start gap-2">
            <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
              1
            </div>
            <p>Share your unique referral code or link with friends</p>
          </div>
          <div className="flex items-start gap-2">
            <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
              2
            </div>
            <p>Your friend signs up using your referral code</p>
          </div>
          <div className="flex items-start gap-2">
            <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
              3
            </div>
            <p>When they complete their first waste pickup, you earn ₦500!</p>
          </div>
          <div className="flex items-start gap-2">
            <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
              4
            </div>
            <p>Invite unlimited friends and keep earning rewards</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
