export type BillingInterval = "monthly" | "yearly";

export type PricingPlanId = "free" | "pro" | "team";

export type PricingPlan = {
  id: PricingPlanId;
  name: string;
  description: string;
  monthlyPrice: number;
  features: string[];
  ctaLabel: string;
  ctaVariant: "ghost" | "primary";
  highlighted?: boolean;
  badge?: string;
};

export const pricingPageCopy = {
  eyebrow: "Pricing",
  headline: "Simple and flexible pricing.",
  subhead: "Start free. Upgrade when you need more power.",
  faqHeadline: "Frequently asked questions",
  faqSubhead: "Everything you need to know about MindVault.",
  yearlySaveLabel: "Save 20%",
} as const;

export const pricingPlans: PricingPlan[] = [
  {
    id: "free",
    name: "Free",
    description: "Perfect for getting started.",
    monthlyPrice: 0,
    features: [
      "Up to 50 AI requests/month",
      "1 GB storage",
      "Basic search",
      "Core features",
      "Access on web",
    ],
    ctaLabel: "Get Started",
    ctaVariant: "ghost",
  },
  {
    id: "pro",
    name: "Pro",
    description: "For students, creators and professionals.",
    monthlyPrice: 9.99,
    features: [
      "Higher AI usage limits",
      "More storage space (10 GB)",
      "Advanced AI features",
      "Priority support",
      "Early access to new features",
    ],
    ctaLabel: "Upgrade to Pro",
    ctaVariant: "primary",
    highlighted: true,
    badge: "Most Popular",
  },
  {
    id: "team",
    name: "Team",
    description: "For teams and organisations.",
    monthlyPrice: 24.99,
    features: [
      "Everything in Pro",
      "Shared workspace",
      "Team collaboration",
      "Admin controls",
      "Priority support",
    ],
    ctaLabel: "Contact Sales",
    ctaVariant: "ghost",
  },
];

export type PricingFaqItem = {
  id: string;
  question: string;
  answer: string;
};

export const pricingFaqs: PricingFaqItem[] = [
  {
    id: "what-is-mindvault",
    question: "What is MindVault?",
    answer:
      "MindVault is your personal knowledge vault — capture notes, links, files and snippets, then search and ask AI questions over what you've saved.",
  },
  {
    id: "data-private",
    question: "Is my data private?",
    answer:
      "Yes. Your vault is tied to your account and encrypted in transit. We use your content only to power features you request, such as search and AI chat.",
  },
  {
    id: "change-plans",
    question: "Can I change plans later?",
    answer:
      "You can start on Free and upgrade anytime. Billing changes apply on your next renewal cycle when paid plans are enabled.",
  },
  {
    id: "free-limit",
    question: "What happens when I hit Free limits?",
    answer:
      "Core capture and search keep working. AI-powered features pause until the next monthly reset or until you upgrade to Pro.",
  },
];

const YEARLY_DISCOUNT = 0.8;

export function planPriceForInterval(
  monthlyPrice: number,
  interval: BillingInterval,
): number {
  if (monthlyPrice === 0) return 0;
  if (interval === "monthly") return monthlyPrice;
  return Math.round(monthlyPrice * YEARLY_DISCOUNT * 100) / 100;
}

export function formatPlanPrice(amount: number): string {
  if (amount === 0) return "$0";
  return `$${amount.toFixed(2).replace(/\.00$/, "")}`;
}

export function billingPeriodLabel(interval: BillingInterval): string {
  return interval === "monthly" ? "/ month" : "/ month, billed yearly";
}
