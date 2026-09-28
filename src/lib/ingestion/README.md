# Smart URL Capture — implementation log

This document records the **architecture review**, **security design**, and **step-by-step implementation** of Smart URL Capture: paste a URL → safely fetch → extract content → preview → analyze → save → existing embeddings/RAG.

Long-term flow:

```
User pastes URL
  → validate + safe fetch + extract (ingestion)
  → preview in Capture UI
  → optional Analyze with AI (existing /api/notes/analyze)
  → Save to Vault (existing POST /api/notes)
  → generateAndStoreNoteEmbedding (existing)
  → semantic search + Ask MindVault (existing RAG)
```

**Status key:** ✅ Done · 🚧 In progress · ⏳ Planned

---

## How we document (after every prompt / step)

**Rule:** When a Smart URL Capture **phase**, **step**, or focused **prompt** finishes (plan-only or code), update **this file** before moving on. Do not rely on chat history alone.

### Checklist per step

1. Set the step heading status (✅ / 🚧 / ⏳).
2. Record **goal** and **explicit out-of-scope** items for that step.
3. List **files created/modified** and **packages added** (if any).
4. Summarize **behavior** (APIs, constants, error codes, security decisions).
5. Note **tests** (`npm run test:ingestion:url`) and **quality** (build/lint).
6. Document **known limitations** and **what the next step receives**.
7. Add a row to **[Changelog](#changelog)** with the date.

### Step index

| Step | Status | Section |
|------|--------|---------|
| Phase 1 — Architecture & plan | ✅ | [below](#phase-1--architecture-inspection--plan-) |
| Phase 2 Step 1 — URL validation / SSRF | ✅ | [below](#phase-2--step-1-secure-url-validation--ssrf-blocklist-) |
| Phase 2 Step 2 — Secure HTTP fetch | ✅ | [below](#phase-2--step-2-safe-http-fetch-) |
| Phase 2 Step 3 — Content extraction | ✅ | [below](#phase-2--step-3-content-extraction-) |
| Phase 2 Step 4 — Ingest API | ✅ | [below](#phase-2--step-4-ingest-api-) |
| Phase 2 Step 5 — Capture UI | ⏳ | [below](#phase-2--step-5-capture-ui-integration-) |
| Phase 2 Step 6 — AI analysis reuse | ⏳ | [below](#phase-2--step-6-ai-analysis-reuse-) |
| Phase 2 Step 7 — E2E testing | ⏳ | [below](#phase-2--step-7-end-to-end-testing-) |

### Copy-paste template for the next step

```markdown
## Phase 2 — Step N: Title ⏳ → ✅

**Goal:** …

**Out of scope for this step:** …

### Files

| Path | Role |
|------|------|

### Behavior

…

### Tests & quality

- `npm run test:ingestion:url` — …
- `npm run build` — …

### Limitations

…

### Handoff to Step N+1

…
```

---

## Phase 1 — Architecture inspection & plan ✅

**Goal:** Inspect the codebase, define V1 scope, SSRF design, API shape, and staged implementation—**no code**.

### Findings (summary)

| Area | Conclusion |
|------|------------|
| **Capture UI** | `CaptureView` / `CaptureForm` — manual content, optional `sourceUrl`, Analyze → `/api/notes/analyze`, Save → `/api/notes` |
| **Data model** | `Note.title`, `content`, `type`, `sourceUrl`, `userId`, `categoryId` — sufficient for V1 (no schema change required) |
| **AI analyze** | `src/lib/ai/analyze-note.ts` — reuse on extracted text after preview |
| **Embeddings** | `generateAndStoreNoteEmbedding` on create — URL notes enter the same pipeline |
| **RAG** | `retrieveRagContext` → same pgvector search as semantic search |
| **New work** | URL validation, safe fetch, HTML extraction, ingest API, Capture URL import UX |

### V1 scope (approved)

**In:** public http/https HTML/text, Readability-style extraction, preserve `sourceUrl`, preview before save, SSRF controls.

**Out (deferred):** YouTube transcripts, PDF, auth/paywall pages, headless JS rendering, huge binaries.

### Proposed API (not built in Phase 1)

- `POST /api/ingest/url` — auth → validate → fetch → extract → **preview only** (no DB write)
- Then existing analyze + save endpoints

### Proposed module layout

```
src/lib/ingestion/url/     # validation, fetch, extract
src/app/api/ingest/url/    # route (Step 4)
```

### Staged plan (Phase 2+)

| Step | Focus |
|------|--------|
| 1 | Secure URL validation + SSRF blocklist |
| 2 | Safe HTTP fetch (timeout, size cap, redirect re-check) |
| 3 | Content extraction (Readability + DOM) |
| 4 | Ingest API |
| 5 | Capture UI integration |
| 6 | AI analysis reuse |
| 7 | End-to-end testing |

### Security themes (design)

- Treat user URLs as **SSRF** input: block private/metadata IPs, resolve DNS, re-check on redirects (Step 2).
- Step 1 alone does **not** prevent DNS rebinding at connect time—Step 2 must pin or re-validate.
- Log host/latency/status—not full page bodies.

---

## Phase 2 — Step 1: Secure URL validation + SSRF blocklist ✅

**Goal:** Server-side primitives to answer:

1. Is this URL structurally allowed?
2. Does this hostname / resolved address point somewhere MindVault must never fetch?

**Explicitly not in this step:** HTTP GET/HEAD, redirects, Readability, ingest API, Capture UI, Gemini, Prisma changes.

### Files created

| Path | Responsibility |
|------|----------------|
| `url/types.ts` | `UrlSafetyErrorCode`, result types, `HostResolver`, `INGEST_URL_MAX_LENGTH` (2048) |
| `url/is-blocked-host.ts` | Hostname blocklist, IPv4/IPv6 classification (`node:net` `BlockList`) |
| `url/validate-url.ts` | `parseIngestUrl`, `validateIngestUrlSafety` |
| `url/resolve-host.ts` | DNS `lookup(..., { all: true })`, injectable resolver |
| `url/*.test.ts` | Structure, IP, hostname, mocked DNS |

### Packages added

**None.** IP ranges use Node built-in `net.BlockList` and `isIP` (no third-party IP library).

### Allowed protocols

- `http:`
- `https:`

All others rejected (`file:`, `ftp:`, `data:`, `javascript:`, `ws:`, `wss:`, …).

### URL parsing rules

- Trim whitespace; reject empty
- Max length **2048** (aligned with note `sourceUrl` validation)
- Parse with platform `URL` (no regex URL validation)
- Reject URLs with **username/password** (`credentials_not_allowed`) — do not strip silently

### Blocked hostnames

- `localhost` (case-insensitive, trailing dot normalized)
- `*.localhost`
- `metadata.google.internal`

Hostname rules alone are **not** sufficient; DNS + IP checks are required for hostnames.

### Blocked IPv4 ranges (public-internet-only policy)

| CIDR | Notes |
|------|--------|
| `0.0.0.0/8` | Non-routable |
| `10.0.0.0/8` | Private |
| `100.64.0.0/10` | Carrier-grade NAT — blocked (not stable public unicast) |
| `127.0.0.0/8` | Loopback |
| `169.254.0.0/16` | Link-local (**includes 169.254.169.254**) |
| `172.16.0.0/12` | Private |
| `192.168.0.0/16` | Private |
| `224.0.0.0/4` | Multicast |
| `240.0.0.0/4` | Reserved |

Public boundary tests: e.g. `172.15.255.255` allowed, `172.16.0.1` blocked, `172.32.0.1` allowed.

### Blocked IPv6 ranges

| CIDR | Purpose |
|------|---------|
| `::1/128` | Loopback |
| `fc00::/7` | Unique local |
| `fe80::/10` | Link-local |
| `ff00::/8` | Multicast |

**IPv4-mapped IPv6** (e.g. `::ffff:127.0.0.1`, `::ffff:7f00:1`) is decoded and checked against IPv4 rules.

### DNS resolution behavior

- Default: `dns.promises.lookup(hostname, { all: true, verbatim: true })`
- **Every** A/AAAA address is classified; **any** blocked address → `blocked_ip`
- Resolver failure → `dns_resolution_failed` (no raw resolver errors to callers)
- Tests use **injected** `HostResolver` — no live public DNS required in CI

**Why all addresses:** dual-stack DNS can return one public and one private record; checking only one is unsafe.

### Public API (server)

```ts
parseIngestUrl(input)  // structure only, no DNS

validateIngestUrlSafety(input, { resolve?: HostResolver })  // full validation
```

**Success shape (internal, server-side):**

```ts
{
  url: URL;
  normalizedUrl: string;
  hostname: string;
  resolvedAddresses: string[];
}
```

**Error codes:** `invalid_url` | `unsupported_protocol` | `credentials_not_allowed` | `url_too_long` | `blocked_hostname` | `blocked_ip` | `dns_resolution_failed`

User-facing copy should stay generic (e.g. “This URL can’t be imported.”); codes are for logs and API mapping.

### Server-only boundary

- DNS lives in `resolve-host.ts` (Node `dns/promises`)
- `validateIngestUrlSafety` **dynamic-imports** `resolve-host` so structural parsing does not pull DNS into unrelated bundles

### Walkthrough examples

| Input | Path | Result |
|-------|------|--------|
| `https://example.com/article` | parse → hostname ok → DNS (mock/public IPs) → all allowed | `ok: true` + `resolvedAddresses` |
| `http://127.0.0.1/admin` | literal IPv4 → `isBlockedIp` | `blocked_ip` (no DNS) |
| `https://evil.example` (DNS → `169.254.169.254`) | resolve → classify | `blocked_ip` |

### Tests & quality

```bash
npm run test:ingestion:url
```

- **41 tests**, all passing (structure, hostnames, IPv4/IPv6, mapped IPv6, mocked DNS including mixed public+private rejection)
- `npm run build` — pass
- ESLint clean on `src/lib/ingestion/url`

### Known limitations (Step 1)

- Passing validation **does not** guarantee a later `fetch()` connects to the same addresses (**DNS rebinding / TOCTOU**).
- No redirect handling, response size limits, or content inspection.
- Metadata hostname list is minimal (extensible in `is-blocked-host.ts`).

### What Step 2 must add

- Timed fetch with byte cap
- Re-run `validateIngestUrlSafety` (or equivalent) on **each redirect hop**
- Connection strategy to reduce rebinding (pin resolved IP or custom agent)
- Map fetch errors to stable codes without leaking internal network details

---

## Phase 2 — Step 2: Safe HTTP fetch ✅

**Goal:** Server-side GET after Step 1 validation, with manual redirects, pinned connections, streaming size limits, and content-type gating — **no extraction**.

### Files

| Path | Role |
|------|------|
| `url/fetch-url.ts` | `fetchValidatedUrl`, pinned undici `Agent`, body reader |
| `url/types.ts` | Extended with `FetchErrorCode`, `FetchValidatedUrlResult`, caps |
| `url/fetch-url.test.ts` | 23 tests (mock `pinnedFetch`) |
| `package.json` | Direct `undici` dependency; `test:ingestion:url` runs all `url/*.test.ts` |

### Transport

- **undici** `fetch` with per-request `Agent` and custom `connect.lookup` returning the **already-validated** address only (no second DNS lookup at connect time).
- **`connect.servername`** set to the URL hostname so **TLS SNI + certificate validation** use the real name while TCP connects to the pinned IP.
- **`redirect: "manual"`** — redirects handled in application code.

### Connection pinning strategy

1. `validateIngestUrlSafety` → `resolvedAddresses[]`
2. For each hop, try addresses in order on connection failure (`ECONNREFUSED`, etc.); **never** call public DNS again for that hop.
3. `lookup()` callback returns only the pinned address passed into `createPinnedDispatcher`.

**Limitation:** Pinning is per hop at validation time. **DNS rebinding** between validation and connect is mitigated by custom lookup (connect does not re-resolve the hostname). A hostile local resolver race remains a general class of bug; redirects re-run full validation each hop.

### Redirect policy

- Statuses: `301`, `302`, `303`, `307`, `308`
- Resolve `Location` with `new URL(location, currentUrl)`
- Re-run **`validateIngestUrlSafety`** on every target (blocks `127.0.0.1`, metadata IPs, etc.)
- Max **5** hops (`INGEST_FETCH_MAX_REDIRECTS`), loop detection via visited `normalizedUrl` set
- Errors: `redirect_limit`, `redirect_loop`, `invalid_redirect`

### Timeout

- **12s per hop** (`INGEST_FETCH_TIMEOUT_MS`) via `AbortController`

### Byte cap

- **2 MB** decompressed (`INGEST_FETCH_MAX_BODY_BYTES`)
- Stream read with early abort; `Content-Length` fast-reject if `> cap` (may false-reject rare gzip edge cases — conservative V1)
- undici exposes **decompressed** body stream when `Accept-Encoding` is set — cap applies to bytes parsed in Step 3

### Content types (Step 2 only)

**Allowed:** `text/html`, `application/xhtml+xml`, `text/plain` (parameters stripped, e.g. `charset=utf-8`)

**Rejected:** `image/*`, `video/*`, `audio/*`, `application/pdf`, `application/octet-stream`, other types → `unsupported_content`

**Defensive:** `binary_content` if body has null bytes or `%PDF` / PNG signatures despite HTML content-type

### Port policy

**Allow any port** allowed by Step 1 structural parsing (e.g. `:8443`). SSRF defense is **IP/DNS classification**, not port blocklist — avoids breaking legitimate non-443 HTTPS while still blocking private targets.

### Public API

```ts
fetchValidatedUrl(inputUrl, {
  resolve?,           // HostResolver (tests)
  pinnedFetch?,       // inject transport (tests)
  maxRedirects?,
  maxBodyBytes?,
  timeoutMs?,
})
```

Success value: `originalUrl`, `finalUrl`, `status`, `contentType`, `body`, `byteLength`, `redirectCount` — no pinned IPs in the result.

### Fetch error codes

`timeout` | `fetch_failed` | `redirect_limit` | `redirect_loop` | `too_large` | `unsupported_content` | `invalid_redirect` | `binary_content` (+ Step 1 codes via validation)

### Tests

**64 total** (`npm run test:ingestion:url`) — Step 1 (41) + Step 2 (23)

### Remaining risks (Step 2)

- Per-hop TOCTOU if OS/DNS outside our lookup were used (mitigated: custom lookup only)
- `Content-Length` vs compressed size false positives
- No HEAD pre-check; full GET only
- UTF-8 decode with replacement (invalid sequences not fatal)
- Arbitrary ports on public IPs still reachable (by design)

### Step 3 input

`fetchValidatedUrl` → `{ body, contentType, finalUrl, … }` for Readability / normalization — no DOM work in Step 2.

---

## Phase 2 — Step 3: Content extraction ✅

**Goal:** Turn a successful Step 2 fetch into a normalized **plain-text preview** (title + content) — no API, UI, AI, or DB.

**Out of scope:** Raw HTML to UI, Gemini titles, ingest orchestrator/API, charset transcoding library.

### Packages added

| Package | Version | Role |
|---------|---------|------|
| `@mozilla/readability` | **0.6.0** | Heuristic main-content extraction (Firefox Reader View algorithm) |
| `linkedom` | **0.18.13** | Lightweight static DOM parse on the server (no JS execution) |

### Files

| Path | Role |
|------|------|
| `url/extract-content.ts` | `extractContent`, `extractContentFromFetch` |
| `url/normalize-content.ts` | Whitespace/control cleanup + 100k cap + `truncated` warning |
| `url/types.ts` | `ExtractContentPreview`, error codes, min meaningful chars |
| `url/extract-content.test.ts` | 14 extraction/normalization tests |

### Extraction approach

| `contentType` | Behavior |
|---------------|----------|
| `text/plain` | Normalize body only — **no DOM** — `extractor: plain_text`, `title: null` |
| `text/html` / `application/xhtml+xml` | `parseHTML(body, { url: finalUrl })` → **Readability** → `textContent` |
| Readability too short | **Fallback:** strip `script/style/nav/header/footer/noscript`, `body.textContent` → `dom_fallback` + warning |

**Not returned:** raw HTML, script/style markup.

### Readability (what it does)

Readability does **not** use AI. It scores DOM nodes (paragraph density, class names, link/text ratios, etc.) to guess the main article node, then emits plain text via `textContent`. It can miss on docs layouts, SPAs, or nav-heavy pages — hence the DOM fallback and `insufficient_content`.

### Title priority

1. Readability `title`  
2. `<title>` text  
3. `null` + warning `title_missing`  

No AI titles, no confident URL-slug titles in V1.

### Normalization rules

- CRLF → LF, trim edges, strip C0 control chars (keep `\n`/`\t`)
- Collapse 3+ blank lines → 2
- Then cap at **`INGEST_EXTRACT_MAX_CONTENT_CHARS` = 100_000** (same as note/analyze limits)
- If capped → warning **`truncated`**

### Minimum useful content

**150 non-whitespace characters** (`INGEST_EXTRACT_MIN_MEANINGFUL_CHARS`) after normalization — avoids success on “Home Login Menu” shells. SPA empty `#root` → `insufficient_content`.

### Error codes

`extract_failed` | `insufficient_content` | `invalid_html`

### Encoding (V1 limitation)

Step 2 decodes bytes as **UTF-8** (`TextDecoder` with non-fatal replacement). `charset=` in `Content-Type` is **not** re-applied in Step 3. Non–UTF-8 pages may garble until a later charset pass.

### Malicious HTML

**linkedom** builds a static DOM only — scripts/event handlers are **not executed** (verified in tests with `throw` scripts and `onclick`).

### Public API

```ts
extractContentFromFetch(fetchResult.value)
extractContent({ originalUrl, finalUrl, contentType, body })
```

### Success shape (Step 4 input)

```ts
{
  originalUrl: string;
  finalUrl: string;
  title: string | null;
  content: string;           // plain text, capped
  contentLength: number;
  extractor: "readability" | "plain_text" | "dom_fallback";
  warnings: ("truncated" | "title_missing" | "dom_fallback")[];
  excerpt?: string;
  byline?: string;
}
```

### Tests & quality

- **`npm run test:ingestion:url`** — **78 tests** (Step 1: 41, Step 2: 23, Step 3: 14)
- `npm run build` — pass
- ESLint — clean on `src/lib/ingestion/url`

### Known limitations

- No JS-rendered content; weak on some doc/nav-heavy sites even with fallback
- UTF-8-only text from Step 2
- Readability + fallback still heuristic — not perfect article boundaries
- Excerpt/byline optional, not required for product path

### Handoff to Step 4

Orchestrator will chain: `validateIngestUrlSafety` → `fetchValidatedUrl` → `extractContentFromFetch` → JSON preview in `POST /api/ingest/url`.

---

## Phase 2 — Step 4: Ingest API ✅

**Goal:** Authenticated preview-only endpoint wiring Steps 1–3 — **no DB, AI, or embeddings**.

**Out of scope:** Capture UI, auto-analyze, auto-save, rate limits (documented for later).

### Files

| Path | Role |
|------|------|
| `url/ingest-url.ts` | Orchestrator: `fetchValidatedUrl` → `extractContentFromFetch` |
| `url/ingest-validation.ts` | JSON body shape (`{ url: string }`) |
| `url/ingest-errors.ts` | HTTP status + safe client messages |
| `url/ingest-log.ts` | Structured `[ingest:url]` logging (hostname, not full URL) |
| `url/ingest-handler.ts` | Testable handler: auth + parse + ingest + map response |
| `app/api/ingest/url/route.ts` | Thin `POST` → `requireApiSession` → handler |
| `url/*.test.ts` | +20 tests (validation, errors, orchestrator, handler) |

### API

**`POST /api/ingest/url`**

Request:

```json
{ "url": "https://example.com/article" }
```

Success (`200`):

```json
{
  "ok": true,
  "preview": {
    "originalUrl": "https://…",
    "finalUrl": "https://…",
    "title": "…",
    "content": "plain text…",
    "contentLength": 1234,
    "extractor": "readability",
    "warnings": []
  }
}
```

Failure: `{ "ok": false, "message": "…" }` — **no internal codes, IPs, or HTML** in the response.

### Auth

Same guard as `POST /api/notes` — `requireApiSession()`. **401** if unauthenticated.

Even without a DB write, auth prevents anonymous use of MindVault as an open HTTP proxy to the internet.

### Error → HTTP mapping

| Codes | Status |
|-------|--------|
| `invalid_url`, `unsupported_protocol`, `credentials_not_allowed`, `url_too_long` | **400** |
| `blocked_hostname`, `blocked_ip` | **403** |
| `timeout` | **504** |
| `too_large` | **413** |
| `unsupported_content`, `binary_content` | **415** |
| `extract_failed`, `insufficient_content`, `invalid_html` | **422** |
| `dns_resolution_failed`, `fetch_failed`, `redirect_*`, `invalid_redirect` | **502** |

Malformed JSON → **400** (`Invalid request.`).

### Logging

`[ingest:url]` — `operation`, `userId`, `hostname` (parsed from input URL), `ok`, `latencyMs`, optional `code`, `redirectCount`, `contentLength`, `extractor`.

Does **not** log full URL query strings, raw HTML, extracted body, or resolved IPs.

### Abuse / rate limits (future)

This endpoint performs outbound fetches per user. Step 4 does **not** implement rate limiting; future work: per-user limits, usage metrics, subscription caps.

### `originalUrl` vs `finalUrl`

Both returned after redirects. **Step 5 (Capture UI)** should choose which to store in `sourceUrl` on save (product decision — typically `finalUrl` canonical page, or user-visible `originalUrl`).

### Tests & quality

- **`npm run test:ingestion:url`** — **98 tests** (Steps 1–4)
- `npm run build` — pass (includes `/api/ingest/url` route)

### Handoff to Step 5

Client helper `ingestUrlRequest` + Capture URL import UI calling this API, then optional `/api/notes/analyze` + existing save — still separate steps.

---

## Phase 2 — Step 5: Capture UI integration ⏳

**Goal:** URL field + Import/Fetch on existing Capture screen; fill `content`, `title`, `sourceUrl`; preview-first; failures must not break manual capture.

**Planned files:** `CaptureUrlImport.tsx`, `ingest-client.ts`, updates to `CaptureForm.tsx`

**Report section:** _To be filled when Step 5 ships._

---

## Phase 2 — Step 6: AI analysis reuse ⏳

**Goal:** After import, use existing `analyzeNoteRequest` / `/api/notes/analyze` on extracted text (optional auto-analyze product decision).

**Report section:** _To be filled when Step 6 ships._

---

## Phase 2 — Step 7: End-to-end testing ⏳

**Goal:** Manual + automated matrix (article, blocked localhost, redirect-to-private, timeout, empty extract, save → embedding → semantic/RAG smoke).

**Report section:** _To be filled when Step 7 ships._

---

## Related project paths (existing capture stack)

| Concern | Location |
|---------|----------|
| Capture UI | `src/components/vault/capture/` |
| Client API | `src/lib/notes/capture-client.ts` |
| Validation | `src/lib/notes/capture-validation.ts`, `src/lib/note-validation.ts` |
| Create note | `src/app/api/notes/route.ts` |
| Analyze | `src/app/api/notes/analyze/route.ts`, `src/lib/ai/analyze-note.ts` |
| Embeddings | `src/lib/notes/embedding-service.ts` |
| RAG | `src/lib/rag/retrieve-context.ts`, `src/lib/rag/ask-vault.ts` |

---

## Changelog

| Date | Milestone |
|------|-----------|
| 2026-09-26 | Phase 1 architecture & plan documented |
| 2026-09-26 | Phase 2 Step 1 — URL safety primitives + tests shipped |
| 2026-09-28 | Phase 2 Step 2 — pinned HTTP fetch + 64 total tests |
| 2026-09-28 | Documentation workflow — document every prompt/step in this README |
| 2026-09-28 | Phase 2 Step 3 — Readability + linkedom extraction, 78 total tests |
| 2026-09-28 | Phase 2 Step 4 — POST /api/ingest/url + orchestrator, 98 total tests |
