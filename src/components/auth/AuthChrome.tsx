"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { ReactNode } from "react";

import { IntroAtmosphere } from "@/components/intro/IntroAtmosphere";
import { brand } from "@/lib/brand";
import { routes } from "@/lib/routes";

type AuthChromeProps = {
  children: ReactNode;
};

export function AuthChrome({ children }: AuthChromeProps) {
  return (
    <main className="relative flex min-h-svh flex-col items-center justify-center overflow-x-hidden overflow-y-auto bg-brand-void px-6 pt-12 pb-12 sm:px-8 sm:pt-14 sm:pb-14">
      <IntroAtmosphere />
      <Link
        href={routes.home}
        className="absolute top-5 left-5 z-20 inline-flex min-h-10 items-center gap-2 text-[0.72rem] tracking-[0.18em] text-white/55 uppercase transition-colors hover:text-white sm:top-8 sm:left-8"
      >
        <ArrowLeft aria-hidden className="size-3.5" />
        Back
      </Link>
      <div className="relative z-10 flex w-full max-w-[24rem] flex-col items-center">
        <Image
          src={brand.logo.src}
          alt={brand.logo.alt}
          width={brand.logo.width}
          height={brand.logo.height}
          placeholder="empty"
          unoptimized
          className="mb-4 h-auto w-12 select-none sm:mb-5 sm:w-14"
        />
        {children}
      </div>
    </main>
  );
}
