import type { ReactNode } from "react";

import { AuthSignInSplitLayout } from "@/components/auth/AuthSignInSplitLayout";

export default function SignInLayout({ children }: { children: ReactNode }) {
  return <AuthSignInSplitLayout>{children}</AuthSignInSplitLayout>;
}
