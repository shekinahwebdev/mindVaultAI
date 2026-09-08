import { NoteDetailView } from "@/components/vault/notes/NoteDetailView";

type VaultNoteDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function VaultNoteDetailPage({
  params,
}: VaultNoteDetailPageProps) {
  const { id } = await params;
  return <NoteDetailView noteId={id} />;
}
