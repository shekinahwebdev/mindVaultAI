import { DashboardView } from "@/components/vault/dashboard/DashboardView";
import { requireSession } from "@/lib/auth/guards";
import { getDashboardData } from "@/lib/vault/dashboard-queries";

async function loadDashboardData(userId: string) {
  try {
    return await getDashboardData(userId);
  } catch (error) {
    console.error("Dashboard load failed:", error);
    throw new Error("Unable to load your vault dashboard. Please try again.");
  }
}

export default async function VaultDashboardPage() {
  const session = await requireSession();
  const data = await loadDashboardData(session.userId);
  return <DashboardView session={session} data={data} />;
}
