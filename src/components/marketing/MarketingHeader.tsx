"use client";

import Image from "next/image";
import Link from "next/link";
import { Search } from "lucide-react";
import { usePathname } from "next/navigation";

import { brand } from "@/lib/brand";
import { blogPageCopy } from "@/lib/marketing/blog-content";
import { marketingRoutes } from "@/lib/marketing/landing-content";
import { cn } from "@/lib/utils";

const navLinkClassName =
  "rounded-md px-1 py-2 text-[0.875rem] text-white/55 transition-colors hover:text-white/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:ring-offset-2 focus-visible:ring-offset-black";

type MarketingHeaderProps = {
  blogSearch?: {
    value: string;
    onChange: (value: string) => void;
  };
  primaryCtaLabel?: string;
};

export function MarketingHeader({
  blogSearch,
  primaryCtaLabel = "Create account",
}: MarketingHeaderProps) {
  const pathname = usePathname();
  const onFeatures =
    pathname === marketingRoutes.features || pathname === "/features";
  const onBlog = pathname === marketingRoutes.blog;
  const onPricing = pathname === marketingRoutes.pricing;
  const isBlogLayout = Boolean(blogSearch);
  const primaryHref =
    primaryCtaLabel === "Get Started"
      ? marketingRoutes.getStarted
      : marketingRoutes.createAccount;

  return (
    <header className="relative z-20 px-[var(--mv-page-padding-x)] pt-6 sm:pt-8">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/55 to-transparent"
      />
      <div
        className={cn(
          "relative mx-auto flex items-center gap-3 sm:gap-4",
          isBlogLayout ? "max-w-[90rem] flex-wrap lg:flex-nowrap" : "max-w-6xl justify-between",
        )}
      >
        <Link
          href="/"
          className={cn(
            "inline-flex min-h-10 shrink-0 items-center gap-2.5 rounded-full pr-2 transition-opacity hover:opacity-90",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:ring-offset-2 focus-visible:ring-offset-black",
          )}
        >
          <Image
            src={brand.logo.src}
            alt=""
            aria-hidden
            width={brand.logo.width}
            height={brand.logo.height}
            unoptimized
            placeholder="empty"
            className="size-8 select-none sm:size-9"
          />
          <span className="text-[0.9375rem] font-semibold tracking-[-0.02em] text-white">
            MindVault
          </span>
        </Link>

        {isBlogLayout ? (
          <>
            <nav
              aria-label="Primary"
              className="hidden shrink-0 items-center gap-6 lg:flex"
            >
              <Link
                href={marketingRoutes.features}
                className={cn(navLinkClassName, onFeatures && "text-white/90")}
              >
                Features
              </Link>
              <Link
                href={marketingRoutes.pricing}
                className={cn(navLinkClassName, onPricing && "text-white/90")}
                aria-current={onPricing ? "page" : undefined}
              >
                Pricing
              </Link>
              <Link
                href={marketingRoutes.blog}
                className={cn(navLinkClassName, onBlog && "text-white/90")}
                aria-current={onBlog ? "page" : undefined}
              >
                Blog
              </Link>
            </nav>

            <label className="min-w-0 w-full flex-1 lg:max-w-md xl:max-w-lg">
              <span className="sr-only">Search blog posts</span>
              <span className="relative flex items-center">
                <Search
                  aria-hidden
                  className="pointer-events-none absolute left-3.5 size-4 text-white/35"
                />
                <input
                  type="search"
                  value={blogSearch!.value}
                  onChange={(event) => blogSearch!.onChange(event.target.value)}
                  placeholder={blogPageCopy.searchPlaceholder}
                  className={cn(
                    "h-10 w-full rounded-full border border-white/10 bg-white/[0.04] py-2 pr-10 pl-10",
                    "text-[0.875rem] text-white placeholder:text-white/35",
                    "focus-visible:border-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/25",
                  )}
                />
                <kbd
                  aria-hidden
                  className="pointer-events-none absolute right-3 hidden rounded border border-white/10 bg-black/40 px-1.5 py-0.5 text-[0.625rem] text-white/30 sm:inline"
                >
                  ⌘K
                </kbd>
              </span>
            </label>

            <nav
              aria-label="Primary"
              className="flex w-full items-center justify-center gap-6 lg:hidden"
            >
              <Link
                href={marketingRoutes.features}
                className={cn(navLinkClassName, onFeatures && "text-white/90")}
              >
                Features
              </Link>
              <Link
                href={marketingRoutes.pricing}
                className={cn(navLinkClassName, onPricing && "text-white/90")}
                aria-current={onPricing ? "page" : undefined}
              >
                Pricing
              </Link>
              <Link
                href={marketingRoutes.blog}
                className={cn(navLinkClassName, onBlog && "text-white/90")}
                aria-current={onBlog ? "page" : undefined}
              >
                Blog
              </Link>
            </nav>
          </>
        ) : (
          <nav
            aria-label="Primary"
            className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-8 md:flex"
          >
            <Link
              href={marketingRoutes.features}
              className={cn(navLinkClassName, onFeatures && "text-white/90")}
              aria-current={onFeatures ? "page" : undefined}
            >
              Features
            </Link>
            <Link
              href={marketingRoutes.pricing}
              className={cn(navLinkClassName, onPricing && "text-white/90")}
              aria-current={onPricing ? "page" : undefined}
            >
              Pricing
            </Link>
            <Link
              href={marketingRoutes.blog}
              className={cn(navLinkClassName, onBlog && "text-white/90")}
              aria-current={onBlog ? "page" : undefined}
            >
              Blog
            </Link>
          </nav>
        )}

        <div className="ml-auto flex shrink-0 items-center gap-2 sm:gap-3">
          <Link href={marketingRoutes.signIn} className="landing-pill-ghost min-h-10 px-4 sm:px-5">
            Sign in
          </Link>
          <Link href={primaryHref} className="landing-pill-primary min-h-10 px-4 sm:px-5">
            {primaryCtaLabel}
          </Link>
        </div>
      </div>
    </header>
  );
}
