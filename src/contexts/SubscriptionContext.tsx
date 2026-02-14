import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

// Premium tier configuration - UPDATE THESE WITH REAL PAYSTACK PLAN CODES
export const PREMIUM_TIERS = {
  basic: {
    name: "Premium Basic",
    planCode: "PLN_premium_basic_placeholder", // Replace with real Paystack plan code
    price: 999, // ₦999/month
    amountKobo: 99900, // Amount in kobo for Paystack
    features: [
      "Priority pickup scheduling",
      "Earn 1 point per completed pickup (₦15 value)",
      "Email support",
      "Monthly activity reports",
    ],
  },
  pro: {
    name: "Premium Pro",
    planCode: "PLN_premium_pro_placeholder", // Replace with real Paystack plan code
    price: 2999, // ₦2,999/month
    amountKobo: 299900, // Amount in kobo for Paystack
    features: [
      "All Basic features",
      "Earn 3 points per pickup (₦20 value each)",
      "Priority customer support",
      "Weekly activity reports",
      "Exclusive member rewards",
      "Early access to new features",
    ],
  },
} as const;

export type PremiumTier = keyof typeof PREMIUM_TIERS | null;

interface SubscriptionState {
  isLoading: boolean;
  isSubscribed: boolean;
  tier: PremiumTier;
  planCode: string | null;
  subscriptionEnd: string | null;
}

interface SubscriptionContextType extends SubscriptionState {
  checkSubscription: () => Promise<void>;
  getTierFromPlanCode: (planCode: string) => PremiumTier;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export const SubscriptionProvider = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState<SubscriptionState>({
    isLoading: true,
    isSubscribed: false,
    tier: null,
    planCode: null,
    subscriptionEnd: null,
  });

  const getTierFromPlanCode = useCallback((planCode: string): PremiumTier => {
    if (planCode === PREMIUM_TIERS.basic.planCode) return "basic";
    if (planCode === PREMIUM_TIERS.pro.planCode) return "pro";
    return null;
  }, []);

  const checkSubscription = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setState({
          isLoading: false,
          isSubscribed: false,
          tier: null,
          planCode: null,
          subscriptionEnd: null,
        });
        return;
      }

      const { data, error } = await supabase.functions.invoke("check-subscription");
      
      if (error) {
        console.error("Error checking subscription:", error);
        setState(prev => ({ ...prev, isLoading: false }));
        return;
      }

      const tier = data.plan_code ? getTierFromPlanCode(data.plan_code) : null;

      setState({
        isLoading: false,
        isSubscribed: data.subscribed || false,
        tier,
        planCode: data.plan_code || null,
        subscriptionEnd: data.subscription_end || null,
      });
    } catch (error) {
      console.error("Error checking subscription:", error);
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, [getTierFromPlanCode]);

  useEffect(() => {
    checkSubscription();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      checkSubscription();
    });

    // Refresh subscription status every minute
    const interval = setInterval(checkSubscription, 60000);

    return () => {
      subscription.unsubscribe();
      clearInterval(interval);
    };
  }, [checkSubscription]);

  return (
    <SubscriptionContext.Provider value={{ ...state, checkSubscription, getTierFromPlanCode }}>
      {children}
    </SubscriptionContext.Provider>
  );
};

export const useSubscription = () => {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error("useSubscription must be used within a SubscriptionProvider");
  }
  return context;
};
