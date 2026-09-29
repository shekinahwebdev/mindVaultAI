import { redirect } from "next/navigation";

export default function VaultSubscriptionRedirectPage() {
  redirect("/vault/settings/subscription");
}
