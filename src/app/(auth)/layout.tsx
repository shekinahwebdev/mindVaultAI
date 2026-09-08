import type { ReactNode } from "react";

import { AuthChrome } from "@/components/auth/AuthChrome";
import { redirectIfAuthenticated } from "@/lib/auth/guards";

export const dynamic = "force-dynamic";

export default async function AuthLayout({
  children,
}: {
  children: ReactNode;
}) {
  await redirectIfAuthenticated();
  return <AuthChrome>{children}</AuthChrome>;
}
