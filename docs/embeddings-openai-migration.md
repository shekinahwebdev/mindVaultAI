# OpenAI embedding migration

MindVault stores **Gemini** and **OpenAI** vectors in separate PostgreSQL columns so existing Gemini embeddings stay usable until OpenAI backfill completes.

## Environment

| Variable | Purpose |
| --- | --- |
| `EMBEDDING_PROVIDER` | `gemini` (default) or `openai` — **writes** for new/updated notes and PDF chunks |
| `EMBEDDING_RETRIEVAL_PROVIDER` | `gemini` (default) or `openai` — **query** embeddings + pgvector search column |
| `OPENAI_API_KEY` | Required when OpenAI is used |
| `OPENAI_EMBEDDING_MODEL` | Default `text-embedding-3-small` |
| `OPENAI_EMBEDDING_DIMENSIONS` | Must be `768` (matches `vector(768)`) |

**Never mix providers in one search:** query vectors and stored columns must use the same provider/model/dimensions filters.

## Storage

- **Notes:** `note_embeddings.embedding` (Gemini) vs `openai_embedding` (OpenAI)
- **PDF chunks:** `document_chunks.embedding` vs `openai_embedding`
- **Progress:** `embedding_migration_checkpoints` (`openai_embedding_migration_v1`)

## Re-embed existing content

```bash
npm run embeddings:migrate-openai -- --dry-run
npm run embeddings:migrate-openai          # runs up to 200 batches
npm run embeddings:migrate-openai -- --once  # single batch
npm run embeddings:migrate-openai -- --cancel
```

The script reuses stored note text and PDF chunk text (no S3 re-download). Gemini columns are not overwritten.

## Cutover

1. Run migration until dry-run shows **0** notes/chunks remaining.
2. Spot-check semantic search and AI Chat RAG manually.
3. Set `EMBEDDING_RETRIEVAL_PROVIDER=openai` (and typically `EMBEDDING_PROVIDER=openai` for new content).
4. Restart app/workers.

Until step 3, retrieval stays on Gemini even if OpenAI columns are partially filled.

## Rollback

Set `EMBEDDING_RETRIEVAL_PROVIDER=gemini` and `EMBEDDING_PROVIDER=gemini`. Gemini columns remain intact; no data loss.

## Rate limits and cost

Migration batches default to 20 notes / 15 chunks per batch with SDK retries on 429/5xx. Tune batch sizes in `scripts/migrate-openai-embeddings.ts`. OpenAI `text-embedding-3-small` billing applies per migrated token.

## Security

API keys stay in environment variables only. Migration logs counts and ids, not note/chunk body text.

## Manual testing

1. Keyword search unchanged.
2. With `EMBEDDING_RETRIEVAL_PROVIDER=gemini`, semantic search matches pre-migration behavior.
3. After backfill + `EMBEDDING_RETRIEVAL_PROVIDER=openai`, `/vault/search` semantic mode and AI Chat return relevant notes/PDFs with page citations.
4. Upload a new PDF after cutover — worker writes `openai_embedding` when `EMBEDDING_PROVIDER=openai`.
