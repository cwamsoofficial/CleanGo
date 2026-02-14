

## Update Subscription Pricing

All pricing is centralized in `src/contexts/SubscriptionContext.tsx`. Only this one file needs to change.

### Changes

**File: `src/contexts/SubscriptionContext.tsx`**

| Field | Current | New |
|-------|---------|-----|
| Basic `price` | 1999 | 999 |
| Basic `amountKobo` | 199900 | 99900 |
| Pro `price` | 4999 | 2999 |
| Pro `amountKobo` | 499900 | 299900 |

The `SubscriptionTab` and `Subscriptions` pages already use `formatPrice()` with these values, so the UI will automatically reflect the new prices everywhere.

### Technical Details

- `price` is the display value in Naira (used by `formatPrice()` to show "₦999" and "₦2,999")
- `amountKobo` is the value sent to Paystack for checkout (kobo = Naira x 100)
- No other files reference these amounts directly -- they all read from `PREMIUM_TIERS`

