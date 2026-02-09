import DashboardLayout from "@/components/DashboardLayout";
import { SubscriptionTab } from "@/components/settings/SubscriptionTab";

const Subscriptions = () => {
  return (
    <DashboardLayout>
      <div className="container max-w-2xl mx-auto py-8 px-4">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground">Subscriptions</h1>
          <p className="text-muted-foreground mt-2">
            View and manage your subscription plan
          </p>
        </div>
        <SubscriptionTab />
      </div>
    </DashboardLayout>
  );
};

export default Subscriptions;
