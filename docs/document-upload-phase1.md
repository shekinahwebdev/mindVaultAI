# Document upload — Phase 1

## S3 bucket requirements

- Private bucket (block all public access).
- No public-read ACLs on objects.
- IAM credentials via the **default AWS credential provider chain** (env keys, instance role, etc.).
- CORS: allow `PUT` from your MindVault web origin for presigned uploads (configure on the bucket).

## Environment variables

| Variable | Required | Description |
|----------|----------|-------------|
| `AWS_S3_DOCUMENT_BUCKET` | Yes (for uploads) | Private bucket name |
| `AWS_REGION` or `AWS_DEFAULT_REGION` | Recommended | Bucket region (default `us-east-1`) |
| `MINDVAULT_DOCUMENT_UPLOAD_ENABLED` | Rollout | Set `true` to enable uploads while plan flag `documentUpload` is still false |
| `MINDVAULT_CLEANUP_SECRET` | Cleanup job | Bearer token for `POST /api/documents/cleanup` |

AWS access keys are **not** exposed to the browser; only short-lived presigned URLs are returned to authenticated clients.

## PDF validation (server)

On **complete**, the server:

1. `HeadObject` — confirms object exists and **Content-Length** matches declared `sizeBytes`.
2. Reads the first bytes of the object and checks the **%PDF-** magic signature (not the client MIME type or filename).

Invalid PDFs are rejected; the object is deleted from S3 and the document is marked `FAILED`.

## Cleanup (scheduled)

Call periodically (e.g. hourly):

```bash
curl -X POST \
  -H "Authorization: Bearer $MINDVAULT_CLEANUP_SECRET" \
  https://your-app.example/api/documents/cleanup
```

Expires `PENDING_UPLOAD` past `uploadExpiresAt`, removes reservations, deletes S3 objects, and purges `EXPIRED` rows.

Do **not** run this on a timer inside a Next.js route handler; use cron, a worker, or your hosting scheduler.
