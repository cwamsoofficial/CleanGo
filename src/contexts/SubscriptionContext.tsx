import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

// Premium tier configuration - UPDATE THESE WITH REAL STRIPE PRICE/PRODUCT IDs
export const PREMIUM_TIERS = {
  basic: {
    name: "Premium Basic",
    priceId: "price_premium_basic_placeholder", // Replace with real Stripe price ID
    productId: "prod_premium_basic_placeholder", // Replace with real Stripe product ID
    price: 1999, // ₦1,999/month
    features: [
      "Priority pickup scheduling",
      "10% bonus rewards on all pickups",
      "Email support",
      "Monthly activity reports",
    ],
  },
  pro: {
    name: "Premium Pro",
    priceId: "price_premium_pro_placeholder", // Replace with real Stripe price ID
    productId: "prod_premium_pro_placeholder", // Replace with real Stripe product ID
    price: 4999, // ₦4,999/month
    features: [
      "All Basic features",
      "25% bonus rewards on all pickups",
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
  priceId: string | null;
  productId: string | null;
  subscriptionEnd: string | null;
}

interface SubscriptionContextType extends SubscriptionState {
  checkSubscription: () => Promise<void>;
  getTierFromPriceId: (priceId: string) => PremiumTier;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export const SubscriptionProvider = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState<SubscriptionState>({
    isLoading: true,
    isSubscribed: false,
    tier: null,
    priceId: null,
    productId: null,
    subscriptionEnd: null,
  });

  const getTierFromPriceId = useCallback((priceId: string): PremiumTier => {
    if (priceId === PREMIUM_TIERS.basic.priceId) return "basic";
    if (priceId === PREMIUM_TIERS.pro.priceId) return "pro";
    // Also check product IDs
    if (priceId === PREMIUM_TIERS.basic.productId) return "basic";
    if (priceId === PREMIUM_TIERS.pro.productId) return "pro";
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
          priceId: null,
          productId: null,
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

      const tier = data.price_id ? getTierFromPriceId(data.price_id) : 
                   data.product_id ? getTierFromPriceId(data.product_id) : null;

      setState({
        isLoading: false,
        isSubscribed: data.subscribed || false,
        tier,
        priceId: data.price_id || null,
        productId: data.product_id || null,
        subscriptionEnd: data.subscription_end || null,
      });
    } catch (error) {
      console.error("Error checking subscription:", error);
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, [getTierFromPriceId]);

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
    <SubscriptionContext.Provider value={{ ...state, checkSubscription, getTierFromPriceId }}>
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
