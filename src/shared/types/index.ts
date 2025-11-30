export enum SubscriptionTier {
  BASIC = 'Basic',
  PRO = 'Pro',
  ENTERPRISE = 'Enterprise',
}

export enum BillingCycle {
  MONTHLY = 'monthly',
  YEARLY = 'yearly',
}

export interface SubscriptionTierConfig {
  tier: SubscriptionTier;
  maxMessages: number;
  price: number;
}

export const SUBSCRIPTION_TIERS: Record<SubscriptionTier, SubscriptionTierConfig> = {
  [SubscriptionTier.BASIC]: {
    tier: SubscriptionTier.BASIC,
    maxMessages: 10,
    price: 9.99,
  },
  [SubscriptionTier.PRO]: {
    tier: SubscriptionTier.PRO,
    maxMessages: 100,
    price: 29.99,
  },
  [SubscriptionTier.ENTERPRISE]: {
    tier: SubscriptionTier.ENTERPRISE,
    maxMessages: -1, // -1 means unlimited
    price: 99.99,
  },
};

export const FREE_MESSAGES_PER_MONTH = 3;

