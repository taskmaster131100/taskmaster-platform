/**
 * Pricing Plans Configuration
 * All prices in USD
 */

export interface PricingFeature {
  name: string;
  included: boolean;
  limit?: number | string;
}

export interface PricingPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  interval: 'month' | 'year';
  stripePriceId?: string; // To be filled when Stripe is configured
  features: PricingFeature[];
  popular?: boolean;
  cta: string;
}

export const PRICING_PLANS: PricingPlan[] = [
  {
    id: 'starter',
    name: 'Starter',
    description: 'Perfect for independent artists starting their career',
    price: 28,
    currency: 'USD',
    interval: 'month',
    stripePriceId: '', // Will be set after Stripe configuration
    features: [
      { name: 'Up to 3 artists', included: true, limit: 3 },
      { name: 'Task management', included: true },
      { name: 'Calendar & events', included: true },
      { name: 'Basic reports', included: true },
      { name: 'Up to 5 KPIs', included: true, limit: 5 },
      { name: 'File storage (5GB)', included: true, limit: '5GB' },
      { name: 'Email support', included: true },
      { name: 'AI planning assistant', included: false },
      { name: 'Advanced analytics', included: false },
      { name: 'Custom branding', included: false },
      { name: 'API access', included: false }
    ],
    cta: 'Start Free Trial'
  },
  {
    id: 'pro',
    name: 'Pro',
    description: 'For professional managers and small agencies',
    price: 79,
    currency: 'USD',
    interval: 'month',
    stripePriceId: '', // Will be set after Stripe configuration
    popular: true,
    features: [
      { name: 'Up to 15 artists', included: true, limit: 15 },
      { name: 'Task management', included: true },
      { name: 'Calendar & events', included: true },
      { name: 'Advanced reports', included: true },
      { name: 'Unlimited KPIs', included: true, limit: 'Unlimited' },
      { name: 'File storage (50GB)', included: true, limit: '50GB' },
      { name: 'Priority email support', included: true },
      { name: 'AI planning assistant', included: true },
      { name: 'Advanced analytics', included: true },
      { name: 'Team collaboration', included: true },
      { name: 'Integrations (Spotify, Instagram)', included: true },
      { name: 'Custom branding', included: false },
      { name: 'API access', included: false }
    ],
    cta: 'Start Free Trial'
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    description: 'For labels, distributors, and large agencies',
    price: 299,
    currency: 'USD',
    interval: 'month',
    stripePriceId: '', // Will be set after Stripe configuration
    features: [
      { name: 'Unlimited artists', included: true, limit: 'Unlimited' },
      { name: 'Task management', included: true },
      { name: 'Calendar & events', included: true },
      { name: 'Advanced reports', included: true },
      { name: 'Unlimited KPIs', included: true, limit: 'Unlimited' },
      { name: 'File storage (500GB)', included: true, limit: '500GB' },
      { name: '24/7 priority support', included: true },
      { name: 'AI planning assistant', included: true },
      { name: 'Advanced analytics', included: true },
      { name: 'Team collaboration', included: true },
      { name: 'All integrations', included: true },
      { name: 'Custom branding', included: true },
      { name: 'API access', included: true },
      { name: 'Dedicated account manager', included: true },
      { name: 'Custom features', included: true }
    ],
    cta: 'Contact Sales'
  }
];

/**
 * Feature limits by plan
 */
export const PLAN_LIMITS = {
  starter: {
    maxArtists: 3,
    maxKPIs: 5,
    maxStorage: 5 * 1024 * 1024 * 1024, // 5GB in bytes
    aiPlanning: false,
    advancedAnalytics: false,
    customBranding: false,
    apiAccess: false
  },
  pro: {
    maxArtists: 15,
    maxKPIs: -1, // -1 = unlimited
    maxStorage: 50 * 1024 * 1024 * 1024, // 50GB in bytes
    aiPlanning: true,
    advancedAnalytics: true,
    customBranding: false,
    apiAccess: false
  },
  enterprise: {
    maxArtists: -1, // -1 = unlimited
    maxKPIs: -1,
    maxStorage: 500 * 1024 * 1024 * 1024, // 500GB in bytes
    aiPlanning: true,
    advancedAnalytics: true,
    customBranding: true,
    apiAccess: true
  }
};

/**
 * Free trial configuration
 */
export const FREE_TRIAL = {
  enabled: true,
  durationDays: 14,
  plan: 'pro' // Users get Pro features during trial
};
