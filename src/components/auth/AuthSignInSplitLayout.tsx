"use client";

import type { ReactNode } from "react";

import { AuthSignInHeroPanel } from "./AuthSignInHeroPanel";
import { AuthSplitLayout } from "./AuthSplitLayout";

type AuthSignInSplitLayoutProps = {
  children: ReactNode;
};

export function AuthSignInSplitLayout({ children }: AuthSignInSplitLayoutProps) {
  return (
    <AuthSplitLayout layout="fullBleed" borderless hero={<AuthSignInHeroPanel />}>
      {children}
    </AuthSplitLayout>
  );
}
