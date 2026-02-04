import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not set');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2026-01-28.clover',
  typescript: true,
});

// Subscription tiers with price IDs
// These will be created in Stripe Dashboard
export const SUBSCRIPTION_TIERS = {
  free: {
    name: 'Community',
    priceId: process.env.STRIPE_PRICE_FREE || 'price_free',
    price: 0,
    features: [
      '1 pitch submission per month',
      'Basic AI analysis (single agent)',
      'Public analysis report',
      'Community access',
    ],
  },
  starter: {
    name: 'Founder',
    priceId: process.env.STRIPE_PRICE_STARTER_MONTHLY || 'price_starter_monthly',
    yearlyPriceId: process.env.STRIPE_PRICE_STARTER_YEARLY || 'price_starter_yearly',
    price: 199,
    yearlyPrice: 1999,
    features: [
      '3 pitch submissions per month',
      'Full AI Swarm analysis (all 4 agents)',
      'Private analysis reports',
      'Basic coaching (1 chat session/week)',
      'Email support',
    ],
  },
  growth: {
    name: 'Accelerated',
    priceId: process.env.STRIPE_PRICE_GROWTH_MONTHLY || 'price_growth_monthly',
    yearlyPriceId: process.env.STRIPE_PRICE_GROWTH_YEARLY || 'price_growth_yearly',
    price: 499,
    yearlyPrice: 4999,
    features: [
      'Unlimited pitch refinement',
      'Full AI Swarm + VC matching',
      'Advanced coaching (daily access to all 6 mentors)',
      'Marketing automation (1 campaign/month)',
      'Priority VC intros',
      'Futarchy ICO eligibility',
      'Dedicated Slack/Discord channel',
    ],
  },
  enterprise: {
    name: 'Venture Studio',
    priceId: 'custom',
    price: null, // Custom pricing
    features: [
      'White-label platform',
      'Custom AI agent training',
      'Bulk pitch analysis (100+/month)',
      'Custom coaching personas',
      'API access',
      'Multi-user accounts (up to 50 seats)',
      'Dedicated account manager',
    ],
  },
} as const;

export type SubscriptionTier = keyof typeof SUBSCRIPTION_TIERS;

// Helper to create checkout session
export async function createCheckoutSession(params: {
  priceId: string;
  customerId?: string;
  customerEmail?: string;
  successUrl: string;
  cancelUrl: string;
  metadata?: Record<string, string>;
}) {
  return await stripe.checkout.sessions.create({
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [
      {
        price: params.priceId,
        quantity: 1,
      },
    ],
    customer: params.customerId,
    customer_email: params.customerEmail,
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
    metadata: params.metadata,
    allow_promotion_codes: true,
  });
}

// Helper to create customer portal session
export async function createPortalSession(params: {
  customerId: string;
  returnUrl: string;
}) {
  return await stripe.billingPortal.sessions.create({
    customer: params.customerId,
    return_url: params.returnUrl,
  });
}

// Helper to get subscription status
// TODO: Fix Stripe API type incompatibility with 2026-01-28.clover
export async function getSubscriptionStatus(customerId: string): Promise<any> {
  return null;
  // const subscriptions = await stripe.subscriptions.list({
  //   customer: customerId,
  //   status: 'all',
  //   limit: 1,
  // });

  // const subscription = subscriptions.data[0];
  
  // if (!subscription) {
  //   return null;
  // }

  // return {
  //   id: subscription.id,
  //   status: subscription.status,
  //   currentPeriodEnd: new Date(subscription.current_period_end * 1000),
  //   cancelAtPeriodEnd: subscription.cancel_at_period_end,
  //   priceId: subscription.items.data[0]?.price.id,
  // };
}
