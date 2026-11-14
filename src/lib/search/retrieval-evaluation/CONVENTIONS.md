# Retrieval evaluation conventions (offline, synthetic)

This module evaluates **note semantic search** using predefined similarity scores. It does not call embedding APIs or prove production retrieval quality.

## Pipeline stages (mirrors unified search notes path)

1. **Rank** all eligible rows by `similarity` descending, tie-break `id` ascending (stable, deterministic).
2. **Candidate pool (Top-K pool)** — keep first `candidatePoolK` unique note ids (default **24**, same as `SEMANTIC_NOTE_POOL` in `search-repository.ts`).
3. **Threshold filter** — drop rows with `similarity < minSimilarity` (production default **0.6** from `RAG_MIN_SIMILARITY`).
4. **Final ranking** — order unchanged from step 2 among survivors; pagination is out of scope.

**Candidate-stage list** = output after step 2. **Final list** = output after step 3.

## Metrics at evaluation K

Let `relevant` = labeled relevant note ids (deduped). Let `topK(ids)` = first `K` ids from a ranked list.

| Metric | Definition |
|--------|------------|
| **Precision@K** | `\|relevant ∩ topK(final)\| / K`. Empty final list ⇒ 0. Positions beyond list length count as misses. |
| **Recall@K** | `\|relevant ∩ topK(final)\| / \|relevant\|`. If `\|relevant\| = 0` ⇒ `null` (not applicable). |
| **F1** | `2PR/(P+R)` when recall is not null; if `P+R = 0` ⇒ 0. |
| **Candidate Recall@K** | `\|relevant ∩ topK(candidate)\| / \|relevant\|`. If `\|relevant\| = 0` ⇒ `null`. |

Duplicate ids in input: keep the **highest similarity** per id, then rank.

## Threshold sweeps

Offline runner compares fixed thresholds (e.g. 0.6, 0.5, 0.4, 0.3) on the same synthetic scores.
