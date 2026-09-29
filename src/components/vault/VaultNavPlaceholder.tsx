import Link from "next/link";

import { EmptyState } from "@/components/mv/EmptyState";
import { PageHeader } from "@/components/mv/PageHeader";
import { PageStack } from "@/components/mv/PageStack";
import { vaultRoutes } from "@/lib/routes";

type VaultNavPlaceholderProps = {
  title: string;
  description: string;
};

export function VaultNavPlaceholder({ title, description }: VaultNavPlaceholderProps) {
  return (
    <PageStack>
      <PageHeader title={title} lead={description} />
      <EmptyState
        variant="solid"
        title={`${title} is coming soon`}
        description="This section is on the roadmap. Your vault, notes, and search continue to work as today."
        action={
          <Link
            href={vaultRoutes.notes}
            className="text-[0.875rem] font-medium text-foreground underline-offset-4 hover:underline"
          >
            Browse all notes
          </Link>
        }
      />
    </PageStack>
  );
}
