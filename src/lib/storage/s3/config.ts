export function getS3BucketName(): string | null {
  const bucket = process.env.AWS_S3_DOCUMENT_BUCKET?.trim();
  return bucket && bucket.length > 0 ? bucket : null;
}

export function getS3Region(): string {
  return process.env.AWS_REGION?.trim() || process.env.AWS_DEFAULT_REGION?.trim() || "us-east-1";
}

export function isS3Configured(): boolean {
  return getS3BucketName() !== null;
}
