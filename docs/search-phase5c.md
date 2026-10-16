# Search Phase 5C — Unified knowledge search

Phase 5C extends the existing `/vault/search` page so **keyword** and **semantic** modes discover both **notes** and **READY PDFs**, with optional **collection** and **tag** filters aligned with the Library (Phase 5B).

## Architecture

```text
SearchView → GET /api/search → searchForUser (search-repository)
                                    ├─ keyword: notes (Prisma) + documents (metadata + chunk ILIKE)
                                    └─ semantic: embedTextForRetrieval (once) → note pgvector + document chunk pgvector
```

Legacy **`GET /api/search/semantic`** remains for compatibility; it delegates to the unified repository with `type=note` and maps results to the previous `{ matches }` shape.

AI Chat RAG (`retrieveRagContext`) is unchanged and continues to use the same embedding model and chunk search module.

## API — `GET /api/search`

| Parameter | Values | Notes |
| --- | --- | --- |
| `q` | string | Required; keyword max 200 chars; semantic 2–500 |
| `mode` | `keyword` \| `semantic` | Default `keyword` |
| `type` | `all` \| `note` \| `document` | Default `all` |
| `tagId` | string | Optional; must belong to user |
| `collectionId` | string | Optional; must belong to user |
| `page` | number | Default 1 |
| `limit` | number | Default 20, max 50 |

Response: `{ ok: true, search: { items, pagination, meta } }` where each item includes `kind`, `title`, `excerpt`, tags, optional `pageStart`/`pageEnd`, optional `similarity`.

Invalid foreign tag/collection → empty result (not an error).

## Keyword search

**Notes:** `buildNotesLibraryWhere` — title/content `contains`, active (non-archived) notes, all note types unless filtered.

**Documents:** READY, non-archived only. Title/filename ILIKE plus body match via `document_chunks.content` ILIKE. One logical result per PDF (best metadata or body excerpt). Ranking: exact title > partial title > filename > body.

## Semantic search

- Single query embedding per request via `embedTextForRetrieval` (provider from `EMBEDDING_RETRIEVAL_PROVIDER`, default Gemini until OpenAI backfill + cutover).
- Stored vectors use the matching column: Gemini `embedding` or OpenAI `openai_embedding` (never mixed in one search).
- Notes: `searchNotesBySimilarity` with optional ID scope for tag/collection filters.
- PDFs: `searchDocumentChunksBySimilarity`, grouped by document (max 3 chunks considered per doc), minimum similarity **0.6** (same as RAG).
- Discovery is **bounded** (24 note / 48 chunk candidates); `meta.semanticDiscoveryBounded` and pagination `hasMore` reflect that this is top-K discovery, not exhaustive scan.

## Collections and tags

Server-side filters reuse `libraryFiltersAreValid` and scoped ID lists — never client-side filtering of a partial result set.

## Pagination

Logical items (one note or one document) are ranked, then sliced by `page`/`limit`. **Load more** appends the next page. Semantic mode may set `hasMore` when the bounded pool may contain additional matches beyond the current page.

## Security

- Session required; `userId` from session only.
- Parameterized SQL for vectors and keyword chunk search.
- Archived notes/documents excluded; PDF content search only for `READY`.
- Cross-user tags/collections return empty results.

## Performance

- Keyword candidate cap (200 notes per query path).
- Semantic DB timeout 8s (aligned with RAG).
- Request cancellation via `AbortController` in the UI.
- No new ANN indexes in this phase.

## Known limitations

- No hybrid (keyword + vector) ranking.
- No in-app PDF page viewer — links use `documentFocus` (highlight/list behavior as today).
- Legacy `/api/search/semantic` returns **notes only**.
- Semantic search requires the configured retrieval provider API key (`GEMINI_API_KEY` or `OPENAI_API_KEY`). See `docs/embeddings-openai-migration.md`.
- Chunk keyword search uses ILIKE (no Postgres FTS index yet).

## Manual testing

1. Open **Vault → Search**. Keyword-search a term in a note title and in PDF body text.
2. Switch to **Semantic**, search a paraphrase; confirm PDF results show page labels and excerpts.
3. Filter by **Documents only**, **Tag**, and **Collection** in both modes.
4. Use **Load more** when many matches exist.
5. Confirm another user cannot see your results (separate session).
6. Confirm **AI Chat** still retrieves notes + PDFs after indexing.
7. After OpenAI cutover (`EMBEDDING_RETRIEVAL_PROVIDER=openai`), repeat semantic search and chat with paraphrased queries.

## Tests

```bash
npm run test:search
```
