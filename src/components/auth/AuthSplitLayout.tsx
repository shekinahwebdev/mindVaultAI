"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { ReactNode } from "react";

import { CosmicSurface } from "@/components/mv/CosmicSurface";
import { brand } from "@/lib/brand";
import { routes } from "@/lib/routes";
import { cn } from "@/lib/utils";

type AuthSplitLayoutProps = {
  children: ReactNode;
  hero: ReactNode;
  /** Sign-up reference: no outer card stroke */
  borderless?: boolean;
  /** Full viewport split — no inset card, matches cosmic background */
  layout?: "card" | "fullBleed";
  /** e.g. sign-up hero column — solid black behind artwork */
  heroColumnClassName?: string;
};

function AuthBrandLockup() {
  return (
    <Link
      href={routes.home}
      className="mb-8 inline-flex w-fit items-center gap-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
    >
      <Image
        src={brand.logo.src}
        alt=""
        aria-hidden
        width={brand.logo.width}
        height={brand.logo.height}
        unoptimized
        placeholder="empty"
        className="size-9 select-none"
      />
      <span className="text-[1rem] font-semibold tracking-[-0.02em] text-white">
        MindVault
      </span>
    </Link>
  );
}

export function AuthSplitLayout({
  children,
  hero,
  borderless = false,
  layout = "card",
  heroColumnClassName,
}: AuthSplitLayoutProps) {
  const isFullBleed = layout === "fullBleed";

  return (
    <CosmicSurface starfield className="flex min-h-svh flex-col overflow-x-hidden bg-background">
      <Link
        href={routes.home}
        className={cn(
          "absolute top-5 left-5 z-20 inline-flex min-h-10 items-center gap-2 rounded-[var(--mv-radius-control)] px-2 text-[0.72rem] tracking-[0.14em] text-white/55 uppercase transition-colors hover:text-white/90",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:ring-offset-2 focus-visible:ring-offset-black",
        )}
      >
        <ArrowLeft aria-hidden className="size-3.5" />
        Back
      </Link>

      {isFullBleed ? (
        <div className="relative z-10 grid min-h-svh w-full lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-stretch">
          <div className="flex flex-col justify-center px-[var(--mv-page-padding-x)] py-14 sm:px-10 lg:py-10 lg:pl-[max(2.5rem,7vw)] lg:pr-12 xl:pl-[max(3.5rem,9vw)]">
            <div className="mx-auto w-full max-w-[min(100%,22rem)] sm:max-w-[26rem] lg:mx-0 lg:max-w-[min(36rem,92%)] xl:max-w-[38rem]">
              <AuthBrandLockup />
              {children}
            </div>
          </div>
          <div
            className={cn(
              "relative flex min-h-[min(520px,55vh)] w-full items-stretch justify-center lg:min-h-svh",
              heroColumnClassName,
            )}
          >
            {hero}
          </div>
        </div>
      ) : (
        <div className="flex flex-1 items-center justify-center px-[var(--mv-page-padding-x)] py-16 sm:py-20">
          <div
            className={cn(
              "relative z-10 grid w-full max-w-[56rem] overflow-hidden rounded-[1.125rem] bg-[#0a0a0a]",
              "lg:min-h-[34rem] lg:grid-cols-2",
              !borderless && "border border-white/10 shadow-[var(--mv-shadow-elevated)]",
            )}
          >
            <div className="flex flex-col bg-[#0a0a0a] px-6 py-8 sm:px-8 sm:py-10 lg:px-10 lg:py-12">
              <AuthBrandLockup />
              {children}
            </div>
            {hero}
          </div>
        </div>
      )}
    </CosmicSurface>
  );
}
