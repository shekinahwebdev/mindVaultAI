import { NotesView } from "@/components/vault/notes/NotesView";
import { NoteType } from "@/generated/prisma/enums";

export default function VaultCodePage() {
  return (
    <NotesView
      presetType={NoteType.CODE}
      pageTitle="Code Snippets"
      pageLead="Code you've saved for later."
    />
  );
}
