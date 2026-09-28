import { redirect } from "next/navigation";

import { routes } from "@/lib/routes";

/** Legacy intro URL → official onboarding entry. */
export default function IntroPage() {
  redirect(routes.onboarding.start);
}
