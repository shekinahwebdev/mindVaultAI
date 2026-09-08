import type { Metadata } from "next";

import { brand } from "@/lib/brand";
import { editorial, geist, signature } from "@/lib/fonts";
import { cn } from "@/lib/utils";
import "@/styles/globals.css";

export const metadata: Metadata = {
  title: brand.name,
  description: brand.tagline,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={cn(
        "dark font-sans",
        geist.variable,
        signature.variable,
        editorial.variable,
      )}
    >
      <body>{children}</body>
    </html>
  );
}
