import type { Metadata } from "next";
import Script from "next/script";
import type { ReactNode } from "react";

import { brand } from "@/lib/brand";
import { editorial, geist, inter, signature } from "@/lib/fonts";
import { cn } from "@/lib/utils";
import "@/styles/globals.css";

export const metadata: Metadata = {
  title: brand.name,
  description: brand.tagline,
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn(
        "dark font-sans",
        geist.variable,
        inter.variable,
        signature.variable,
        editorial.variable,
      )}
    >
      <body>
        <Script src="/mindvault-theme-init.js" strategy="beforeInteractive" />
        {children}
      </body>
    </html>
  );
}
