import { ReactNode, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { getUserRole, type UserRole } from "@/lib/supabase";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Home,
  Package,
  AlertCircle,
  BarChart3,
  Gift,
  Users,
  Trophy,
  Award,
  Settings,
  LogOut,
  Shield,
  CreditCard,
} from "lucide-react";
import logo from "@/assets/cwamso-logo.png";

interface DashboardLayoutProps {
  children: ReactNode;
}

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const navigate = useNavigate();
  const [role, setRole] = useState<UserRole | null>(null);
  const [userName, setUserName] = useState<string>("");

  useEffect(() => {
    const fetchUserData = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        navigate("/auth");
        return;
      }

      // Check if user is banned
      const { data: profile } = await supabase
        .from("profiles")
        .select("name, banned, banned_reason")
        .eq("id", user.id)
        .single();

      if (profile?.banned) {
        await supabase.auth.signOut();
        navigate("/auth");
        return;
      }

      const userRole = await getUserRole(user.id);
      setRole(userRole);

      if (profile) {
        setUserName(profile.name);
      }
    };

    fetchUserData();
  }, [navigate]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  const getMenuItems = () => {
    const common = [
      { icon: Home, label: "Dashboard", path: "/dashboard" },
    ];

    const roleSpecific = {
      citizen: [
        { icon: Package, label: "My Pickups", path: "/dashboard/pickups" },
        { icon: AlertCircle, label: "Report Issue", path: "/dashboard/report-issue" },
        { icon: CreditCard, label: "Billing", path: "/dashboard/billing" },
        { icon: Gift, label: "Rewards", path: "/dashboard/rewards" },
        { icon: Trophy, label: "Leaderboard", path: "/dashboard/leaderboard" },
        { icon: Award, label: "Achievements", path: "/dashboard/achievements" },
      ],
      company: [
        { icon: Package, label: "Pickups", path: "/dashboard/pickups" },
        { icon: AlertCircle, label: "Report Issue", path: "/dashboard/report-issue" },
        { icon: CreditCard, label: "Billing", path: "/dashboard/billing" },
        { icon: Gift, label: "Rewards", path: "/dashboard/rewards" },
        { icon: Trophy, label: "Leaderboard", path: "/dashboard/leaderboard" },
        { icon: Award, label: "Achievements", path: "/dashboard/achievements" },
      ],
      collector: [
        { icon: Package, label: "Pickups", path: "/dashboard/pickups" },
        { icon: AlertCircle, label: "Issues", path: "/dashboard/issues" },
        { icon: CreditCard, label: "Payments", path: "/dashboard/billing" },
        { icon: BarChart3, label: "Analytics", path: "/dashboard/analytics" },
        { icon: Trophy, label: "Leaderboard", path: "/dashboard/leaderboard" },
        { icon: Award, label: "Achievements", path: "/dashboard/achievements" },
      ],
      admin: [
        { icon: Shield, label: "Admin Dashboard", path: "/dashboard/admin" },
        { icon: Package, label: "All Pickups", path: "/dashboard/pickups" },
        { icon: AlertCircle, label: "Issues", path: "/dashboard/issues" },
        { icon: CreditCard, label: "Billing Activity", path: "/dashboard/billing" },
        { icon: BarChart3, label: "Analytics", path: "/dashboard/analytics" },
        { icon: Trophy, label: "Leaderboard", path: "/dashboard/leaderboard" },
      ],
    };

    return [...common, ...(role ? roleSpecific[role] : [])];
  };

  if (!role) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <Sidebar>
          <SidebarHeader className="border-b border-sidebar-border px-4 py-4">
            <div className="flex items-center gap-3">
              <img src={logo} alt="CWaMSo Logo" className="h-10 w-auto" />
              <div>
                <h2 className="font-semibold text-sidebar-foreground">CWaMSo</h2>
                <p className="text-xs text-sidebar-foreground/70 capitalize">{role} Portal</p>
              </div>
            </div>
          </SidebarHeader>

          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Menu</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {getMenuItems().map((item) => {
                    // Add data-tour attributes for interactive tour
                    const tourId = item.label.toLowerCase().replace(/\s+/g, '-');
                    return (
                      <SidebarMenuItem key={item.path}>
                        <SidebarMenuButton
                          onClick={() => navigate(item.path)}
                          className="w-full"
                          data-tour={`nav-${tourId}`}
                        >
                          <item.icon className="w-4 h-4" />
                          <span>{item.label}</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>

          <SidebarFooter className="border-t border-sidebar-border p-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="w-full justify-start px-2 h-auto py-2"
                >
                  <Avatar className="w-8 h-8 mr-2">
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {userName.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col items-start text-left">
                    <span className="text-sm font-medium">{userName}</span>
                    <span className="text-xs text-muted-foreground capitalize">{role}</span>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate("/dashboard/settings")}>
                  <Settings className="w-4 h-4 mr-2" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarFooter>
        </Sidebar>

        <main className="flex-1 flex flex-col">
          <header className="border-b border-border bg-card px-6 py-4 flex items-center">
            <SidebarTrigger className="mr-4" />
            <h1 className="text-xl font-semibold">
              {userName ? `Welcome, ${userName}` : "Dashboard"}
            </h1>
          </header>
          <div className="flex-1 p-6 bg-background overflow-auto">{children}</div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default DashboardLayout;
