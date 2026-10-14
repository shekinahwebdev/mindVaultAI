# Library Phase 5B — Collections, tags, and organization

Phase 5B extends the unified Library (`/vault/library`) so users can group notes and PDFs into **collections** and tag **PDF documents** with the same tag model used for notes.

## Schema changes

Migration: `prisma/migrations/20261014020000_library_collections_document_tags/migration.sql`

| Model | Purpose |
| --- | --- |
| `Collection` | User-owned named group with optional description. Unique `(userId, name)`. |
| `CollectionItem` | Join row linking a collection to a note **or** a document. Unique `(collectionId, noteId)` and `(collectionId, documentId)`. Deleting a collection cascades items only. |
| `DocumentTag` | Composite PK `(documentId, tagId)` reusing existing `Tag` rows. |

Notes already use `NoteTag`; documents now use `DocumentTag` so tags are shared across content types.

## API endpoints

All routes require an authenticated session (`requireApiSession`).

### Collections

| Method | Path | Description |
| --- | --- | --- |
| `GET` | `/api/collections` | List current user's collections with item counts. |
| `POST` | `/api/collections` | Create collection `{ name, description? }`. |
| `GET` | `/api/collections/[id]` | Collection detail (ownership enforced). |
| `PATCH` | `/api/collections/[id]` | Rename / update description. |
| `DELETE` | `/api/collections/[id]` | Delete collection (memberships only). |
| `POST` | `/api/collections/[id]/items` | Add `{ kind: "note" \| "document", itemId }`. |
| `DELETE` | `/api/collections/[id]/items?kind=&itemId=` | Remove membership. |

### Document tags

| Method | Path | Description |
| --- | --- | --- |
| `PUT` | `/api/documents/[id]/tags` | Replace tags `{ tagIds: string[] }` on an active library document. |

Note tags continue to use `PATCH /api/notes/[id]` with `tagIds`.

### Library list

`GET /api/library` accepts optional query params:

- `tagId` — items tagged with this tag (notes via `NoteTag`, documents via `DocumentTag`).
- `collectionId` — items in this collection.

Invalid or foreign `tagId` / `collectionId` values return an empty page (no cross-user leakage).

## Collection behavior

- A note or PDF may belong to **multiple** collections.
- Adding the same item twice is idempotent (`upsert` on membership).
- Only non-archived notes and active library documents can be added.
- Deleting a collection never deletes notes or PDFs.

## Tag integration

- Tags remain user-scoped (`Tag.userId`).
- Library serialization includes tags on both notes and documents.
- Library filtering uses a single `tagId` parameter for mixed lists.
- Document tag replacement validates ownership with `tagIdsBelongToUser`.

## Security decisions

- Every collection and membership operation checks `collection.userId === session.userId`.
- Items must belong to the same user before they can be added to a collection.
- Document tag assignment rejects tags owned by another user.
- Library filters verify tag/collection ownership before querying; unknown IDs yield empty results.
- Archived notes and non-library document statuses follow existing Phase 5A visibility rules.

## Manual testing

1. Sign in and open **Vault → Library**.
2. **Collections tab**: create a collection, open it (filters All items), add a note and PDF via card menu **Add to collection**, delete collection and confirm content remains in Library.
3. **Tags tab**: click a tag; confirm filtered items. On a PDF card, **Manage tags**, save, and confirm badges update.
4. Combine search, type filter, sort, tag filter, and collection filter; paginate with **Load more**.
5. Sign in as another user; confirm collections and filtered library data are not visible.

## Tests

```bash
npm run test:library
```

Integration cases (when `DATABASE_URL` is set) cover collection CRUD, duplicate membership, mixed library filtering, cross-user access, and document tag ownership.
