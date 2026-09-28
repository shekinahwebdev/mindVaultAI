import type { Metadata } from "next";

import { PricingPage } from "@/components/marketing/PricingPage";
import { brand } from "@/lib/brand";
import { pricingPageCopy } from "@/lib/marketing/pricing-content";

export const metadata: Metadata = {
  title: `Pricing — ${brand.name}`,
  description: pricingPageCopy.subhead,
};

export default function PricingRoutePage() {
  return <PricingPage />;
}
