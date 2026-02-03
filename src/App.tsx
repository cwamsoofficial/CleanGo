import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { UserProfileProvider } from "@/contexts/UserProfileContext";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import Contact from "./pages/Contact";
import Dashboard from "./pages/Dashboard";
import AdminDashboard from "./pages/AdminDashboard";
import AdminLogin from "./pages/AdminLogin";

import AdminResetPassword from "./pages/AdminResetPassword";
import Pickups from "./pages/Pickups";
import ReportIssue from "./pages/ReportIssue";
import Rewards from "./pages/Rewards";
import Analytics from "./pages/Analytics";
import Issues from "./pages/Issues";
import Leaderboard from "./pages/Leaderboard";
import Achievements from "./pages/Achievements";
import Settings from "./pages/Settings";
import Billing from "./pages/Billing";
import ActivityHistory from "./pages/ActivityHistory";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <UserProfileProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/admin/login" element={<AdminLogin />} />
            
            <Route path="/admin/reset-password" element={<AdminResetPassword />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/dashboard/admin" element={<AdminDashboard />} />
            <Route path="/dashboard/pickups" element={<Pickups />} />
            <Route path="/dashboard/report-issue" element={<ReportIssue />} />
            <Route path="/dashboard/rewards" element={<Rewards />} />
            <Route path="/dashboard/analytics" element={<Analytics />} />
            <Route path="/dashboard/issues" element={<Issues />} />
            <Route path="/dashboard/leaderboard" element={<Leaderboard />} />
            <Route path="/dashboard/achievements" element={<Achievements />} />
            <Route path="/dashboard/settings" element={<Settings />} />
            <Route path="/dashboard/billing" element={<Billing />} />
            <Route path="/dashboard/activity" element={<ActivityHistory />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </UserProfileProvider>
  </QueryClientProvider>
);

export default App;
