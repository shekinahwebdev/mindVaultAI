"use client";

import type { ReactNode } from "react";

import { AuthSignUpHeroPanel } from "./AuthSignUpHeroPanel";
import { AuthSplitLayout } from "./AuthSplitLayout";

type AuthSignUpSplitLayoutProps = {
  children: ReactNode;
};

export function AuthSignUpSplitLayout({ children }: AuthSignUpSplitLayoutProps) {
  return (
    <AuthSplitLayout
      layout="fullBleed"
      borderless
      heroColumnClassName="bg-black"
      hero={<AuthSignUpHeroPanel />}
    >
      {children}
    </AuthSplitLayout>
  );
}
