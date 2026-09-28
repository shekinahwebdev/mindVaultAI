import type { ReactNode } from "react";

import { AuthSignUpSplitLayout } from "@/components/auth/AuthSignUpSplitLayout";

export default function SignUpLayout({ children }: { children: ReactNode }) {
  return <AuthSignUpSplitLayout>{children}</AuthSignUpSplitLayout>;
}
