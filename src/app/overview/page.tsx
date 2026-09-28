import type { Metadata } from "next";

import { FeaturesOverviewPage } from "@/components/marketing/FeaturesOverviewPage";
import { brand } from "@/lib/brand";
import { featuresOverviewCopy } from "@/lib/marketing/features-content";

export const metadata: Metadata = {
  title: `Overview — ${brand.name}`,
  description: featuresOverviewCopy.subhead,
};

export default function OverviewRoutePage() {
  return <FeaturesOverviewPage />;
}
