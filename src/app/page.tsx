import type { Metadata } from "next";

import { LandingPage } from "@/components/marketing/LandingPage";
import { brand } from "@/lib/brand";

export const metadata: Metadata = {
  title: `${brand.name} — ${brand.tagline}`,
  description:
    "Capture what matters. Let MindVault organize your knowledge and help you find it again when you need it.",
};

export default function Home() {
  return <LandingPage />;
}
