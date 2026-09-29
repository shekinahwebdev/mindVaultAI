import { TagDetailView } from "@/components/vault/tags/TagDetailView";

type VaultTagDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function VaultTagDetailPage({
  params,
}: VaultTagDetailPageProps) {
  const { id } = await params;
  return <TagDetailView tagId={id} />;
}
