import { defaultProvider } from "@aws-sdk/credential-provider-node";
import type { AwsCredentialIdentityProvider } from "@smithy/types";

/**
 * Resolves AWS credentials for the S3 client using the SDK default chain,
 * honoring AWS_PROFILE when set (shared ~/.aws/credentials + config).
 */
export function createS3CredentialProvider(): AwsCredentialIdentityProvider {
  const profile = process.env.AWS_PROFILE?.trim();
  return defaultProvider(profile ? { profile } : {});
}
