# MindVault billing & usage

## Concepts

- **Plan** — product configuration (Free, Pro): limits and feature flags (`PLAN_LIMITS`).
- **Subscription** — MindVault’s per-user row: effective plan, status, Paystack IDs.
- **Paystack** — payment processor: charges cards, creates Paystack subscriptions, sends webhooks.
- **Entitlements** — `getUserEntitlements()` from PostgreSQL only (not Paystack per request).

Paystack is the **source of truth for paid state**; MindVault mirrors it via verified transactions + webhooks into `subscriptions`.

## Paystack (TEST integration)

### Environment (names only — never commit values)

- `PAYSTACK_SECRET_KEY` — `sk_test_…` only in this phase
- `PAYSTACK_PRO_PLAN_CODE` — plan created once in Paystack TEST (e.g. `PLN_…`)
- `APP_URL` — callback base (e.g. `http://localhost:3003`)

No `NEXT_PUBLIC_*` Paystack secret. No separate webhook secret — Paystack signs with the **secret key** (`x-paystack-signature` = HMAC-SHA512 hex of raw body).

### Pro plan (TEST)

Marketing Pro is **$9.99/mo** (`PAYSTACK_PRO_LIST_PRICE_USD` in code). Create a matching **TEST** plan in Paystack using your integration currency (amount in **subunits**: kobo/cents).

One-time helper:

```bash
PAYSTACK_SECRET_KEY=sk_test_... \
PAYSTACK_PRO_AMOUNT_SUBUNITS=... \
PAYSTACK_PRO_CURRENCY=NGN \
npx tsx scripts/paystack-create-pro-plan.ts
```

Set `PAYSTACK_PRO_PLAN_CODE` from output. **Do not** create a new plan on every checkout.

### Checkout flow

1. `POST /api/billing/checkout` (session) → Paystack `POST /transaction/initialize` with `plan`, session email, metadata `mindvault_user_id`, callback URL.
2. Browser redirects to Paystack-hosted checkout (no card data in MindVault).
3. Return URL: `/vault/settings/subscription/callback?reference=…`
4. `POST /api/billing/confirm` verifies `GET /transaction/verify/:reference` — UX only; not sole proof.
5. `POST /api/billing/paystack/webhook` — **authoritative** after HMAC verification.

Handled events (official Paystack names):

- `charge.success` — verify transaction, activate Pro, record `billing_transactions`
- `subscription.create` — store subscription code + email token
- `subscription.disable` — downgrade to Free
- `subscription.not_renew` — set `cancelAtPeriodEnd`

Idempotency: `billing_provider_events.event_key` unique per event+reference.

### Local webhooks

Paystack must reach a **public HTTPS** URL. Use a tunnel (ngrok, Cloudflare Tunnel) pointing to `/api/billing/paystack/webhook`. Callback can work on localhost; webhooks cannot.

### Manage / cancel

- `POST /api/billing/manage` → Paystack `GET /subscription/:code/manage/link`
- `POST /api/billing/cancel` → Paystack `POST /subscription/disable` with subscription code + **email token** (stored server-side only)

### Going live checklist

- Replace `sk_test_` with live key only after explicit go-live gate (code currently rejects non-test keys).
- Create **live** Paystack plan; new `PAYSTACK_PRO_PLAN_CODE`.
- Configure live webhook URL in Paystack dashboard.
- Legal/tax review for your markets.

## Plans

| Plan | AI / month (UTC) | Storage |
|------|------------------|---------|
| Free | 50 | 1 GB |
| Pro  | 2,000 | 10 GB |

## AI usage

Counts: Analyze success, Chat Gemini success (not embeddings, not `no_relevant_knowledge`).

## Storage

Uploaded binary files only (V1: avatar data URLs). Note text is not metered.

## APIs

- `GET /api/subscription`
- `POST /api/billing/checkout`
- `POST /api/billing/confirm`
- `POST /api/billing/paystack/webhook`
- `POST /api/billing/manage`
- `POST /api/billing/cancel`
