import { NotesView } from "@/components/vault/notes/NotesView";
import { NoteType } from "@/generated/prisma/enums";

export default function VaultQuotesPage() {
  return (
    <NotesView
      presetType={NoteType.QUOTE}
      pageTitle="Quotes"
      pageLead="Quotes and passages you've captured."
    />
  );
}
