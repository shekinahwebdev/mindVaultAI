# Unified Library (Phase 5A)

## Overview

The Library page at `/vault/library` lists **active notes** and **listable PDF documents** for the signed-in user in one grid. Notes and Documents routes are unchanged.

## Architecture

| Layer | Path |
|-------|------|
| UI | `LibraryView`, `LibraryItemCard` |
| Client | `library-client.ts`, `use-library-list.ts` |
| API | `GET /api/library` |
| Query | `library-validation.ts`, `library-repository.ts` |

## Data access

- **Notes:** Reuses `buildNotesListWhere` / `activeNoteWhere` (non-archived only).
- **Documents:** `activeLibraryDocumentWhere` — same status set as the documents page, plus `archivedAt IS NULL`.
- **All types:** PostgreSQL `UNION ALL` over notes + documents, global `ORDER BY`, `LIMIT` / `OFFSET` for stable mixed pagination.
- **Single-type filters:** Standard Prisma `findMany` + `count` (no union).

Search (`q`) matches note title/content and document title/filename (case-insensitive). No vector search in this phase.

## Security

- `requireApiSession` on `/api/library`; `userId` always from session.
- Hydration re-checks ownership when loading note/document details by id.

## Manual testing

1. Sign in → **Library** in sidebar → grid shows notes and PDFs.
2. Filter **Notes** / **Documents** / **All**.
3. Search a word from a note body and a PDF title.
4. Change sort → order updates; **Load more** appends pages.
5. Open a note card → note detail; PDF card → documents page with focus query.
6. Confirm **All Notes** and **Documents** pages still work.
