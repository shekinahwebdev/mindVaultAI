import { redirect } from "next/navigation";

import { routes } from "@/lib/routes";

/** Legacy URL — product overview lives at /overview */
export default function FeaturesRoutePage() {
  redirect(routes.overview);
}
