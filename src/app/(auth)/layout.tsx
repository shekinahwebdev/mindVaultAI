import type { ReactNode } from "react";

import { redirectIfAuthenticated } from "@/lib/auth/guards";

export const dynamic = "force-dynamic";

export default async function AuthLayout({ children }: { children: ReactNode }) {
  await redirectIfAuthenticated();
  return children;
}
