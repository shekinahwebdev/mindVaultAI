import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import { getS3BucketName, getS3Region } from "./config";
import { createS3CredentialProvider } from "./credentials";
import type { DocumentS3Adapter, S3ObjectHead } from "./types";

let cachedClient: S3Client | null = null;
let cachedProfile: string | undefined;

function getClient(): S3Client {
  const profile = process.env.AWS_PROFILE?.trim();
  if (!cachedClient || cachedProfile !== profile) {
    cachedClient = new S3Client({
      region: getS3Region(),
      credentials: createS3CredentialProvider(),
    });
    cachedProfile = profile;
  }
  return cachedClient;
}

function requireBucket(): string {
  const bucket = getS3BucketName();
  if (!bucket) {
    throw new Error("AWS_S3_DOCUMENT_BUCKET is not configured.");
  }
  return bucket;
}

export function createDocumentS3Adapter(): DocumentS3Adapter {
  return {
    async createPresignedUploadUrl(params) {
      const bucket = requireBucket();
      const command = new PutObjectCommand({
        Bucket: bucket,
        Key: params.storageKey,
        ContentType: params.contentType,
        ContentLength: params.sizeBytes,
      });
      return getSignedUrl(getClient(), command, {
        expiresIn: params.expiresInSeconds,
      });
    },

    async headObject(storageKey: string): Promise<S3ObjectHead | null> {
      const bucket = requireBucket();
      try {
        const result = await getClient().send(
          new HeadObjectCommand({ Bucket: bucket, Key: storageKey }),
        );
        return {
          sizeBytes: Number(result.ContentLength ?? 0),
          contentType: result.ContentType ?? null,
        };
      } catch (error) {
        const name = (error as { name?: string }).name;
        if (name === "NotFound" || name === "NoSuchKey") {
          return null;
        }
        throw error;
      }
    },

    async readObjectBytes(storageKey: string, maxBytes: number): Promise<Uint8Array> {
      const bucket = requireBucket();
      const result = await getClient().send(
        new GetObjectCommand({
          Bucket: bucket,
          Key: storageKey,
          Range: `bytes=0-${Math.max(0, maxBytes - 1)}`,
        }),
      );
      const body = result.Body;
      if (!body) {
        return new Uint8Array(0);
      }
      const bytes = await body.transformToByteArray();
      return bytes.slice(0, maxBytes);
    },

    async deleteObject(storageKey: string): Promise<void> {
      const bucket = requireBucket();
      await getClient().send(
        new DeleteObjectCommand({ Bucket: bucket, Key: storageKey }),
      );
    },

    async createPresignedDownloadUrl(params) {
      const bucket = requireBucket();
      const command = new GetObjectCommand({
        Bucket: bucket,
        Key: params.storageKey,
        ResponseContentDisposition: `attachment; filename="${encodeURIComponent(params.downloadFilename).replace(/%/g, "")}"`,
      });
      return getSignedUrl(getClient(), command, {
        expiresIn: params.expiresInSeconds,
      });
    },
  };
}
