import { NotesView } from "@/components/vault/notes/NotesView";
import { NoteType } from "@/generated/prisma/enums";

export default function VaultLinksPage() {
  return (
    <NotesView
      presetType={NoteType.LINK}
      pageTitle="Saved Links"
      pageLead="Links you've saved to your vault."
    />
  );
}
