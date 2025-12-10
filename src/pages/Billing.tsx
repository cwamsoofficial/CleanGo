import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getUserRole, type UserRole } from "@/lib/supabase";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CreditCard, Receipt, TrendingUp } from "lucide-react";

const Billing = () => {
  const [role, setRole] = useState<UserRole | null>(null);

  useEffect(() => {
    const fetchRole = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const userRole = await getUserRole(user.id);
        setRole(userRole);
      }
    };
    fetchRole();
  }, []);

  const getTitle = () => {
    if (role === "collector") return "Payments";
    if (role === "admin") return "Billing Activity";
    return "Billing & Payments";
  };

  const getDescription = () => {
    if (role === "collector") return "View and confirm payment information";
    if (role === "admin") return "Monitor payment activities across the platform";
    return "Manage your waste service bills and payments";
  };

  const getIcon = () => {
    if (role === "collector") return <Receipt className="h-12 w-12 text-muted-foreground/50" />;
    if (role === "admin") return <TrendingUp className="h-12 w-12 text-muted-foreground/50" />;
    return <CreditCard className="h-12 w-12 text-muted-foreground/50" />;
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold text-foreground">{getTitle()}</h2>
          <p className="text-muted-foreground mt-1">{getDescription()}</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Coming Soon</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-12">
              {getIcon()}
              <p className="mt-4 text-muted-foreground text-center">
                Billing features are currently under development.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Billing;
