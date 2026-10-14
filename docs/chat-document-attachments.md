# Chat document attachments (Phase 4)

## Overview

AI Chat reuses the existing document upload pipeline and unified RAG stack. Users attach PDFs from the composer paperclip, ask scoped questions, and get citations—without a separate document chatbot.

## UI flow

1. **Paperclip menu** — “Choose from Vault” or “Upload New PDF” (Escape closes the menu).
2. **Vault picker** — Searchable list with title, file size, and processing status. Multiple selection (max 8 IDs server-side).
3. **Chips** — Selected PDFs appear above the textarea with status; removable with ×.
4. **Upload** — Same initiate → S3 presign → complete APIs as the Documents page. Progress shown on a chip; catalog polls until Ready/Failed.

Attachments persist on the conversation (`attached_document_ids`, `attachment_include_notes`) via:

- `POST /api/chat` (each message)
- `PATCH /api/conversations/[id]/attachments` (when a conversation already exists)

## Document-scoped retrieval

When `attachedDocumentIds` is non-empty:

1. `resolveChatAttachmentScope` validates ownership (session `userId` only).
2. Only **READY** owned documents are passed to pgvector chunk search.
3. `restrictToAttachedDocuments: true` — unrelated vault PDFs are never retrieved.
4. **Notes are off by default**; optional “Also search my notes” sets `attachmentIncludeNotes`.

When no attachments are sent, behavior matches pre–Phase 4 unified RAG (notes + READY PDFs).

## Security

- Client-supplied document IDs are always re-validated in `resolveChatAttachmentScope`.
- Chunk SQL filters `documents.user_id` and `status = 'READY'`.
- No PDF bytes or S3 URLs in chat metadata—IDs only.

## Errors and empty results

| Situation | Behavior |
|-----------|----------|
| Upload / network failure | Toast; chip removed or retry via Documents |
| Processing attachment | Searchable only after Ready; disclaimer in RAG prompt |
| Dropped / deleted attachment | Scoped empty answer; no fallback to other PDFs |
| No matching chunks | `buildAttachmentEmptyAnswer` (attachment-scoped copy) |
| Embedding / OpenAI failure | Existing provider failure + graceful degradation rules |

## Manual testing

1. **Vault attach** — Chat → paperclip → Choose from Vault → select READY PDFs → ask a question about their content → Sources show grouped PDF + pages.
2. **Upload** — Paperclip → Upload New PDF → complete upload → chip shows processing → poll until Ready → ask scoped question.
3. **Persistence** — Attach PDFs, send a message, reload conversation → chips restored.
4. **Scoped isolation** — Attach one PDF; ask about content that exists only in another vault PDF → answer should not cite the other file.
5. **Notes toggle** — Attach PDF, enable “Also search my notes”, ask a question spanning both.

## Related docs

- [unified-rag-phase3.md](./unified-rag-phase3.md) — Mixed note + PDF retrieval
- [document-upload-phase1.md](./document-upload-phase1.md) — Upload APIs
- [document-processing-phase2b.md](./document-processing-phase2b.md) — Indexing to READY
