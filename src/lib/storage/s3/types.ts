export type S3ObjectHead = {
  sizeBytes: number;
  contentType: string | null;
};

export type DocumentS3Adapter = {
  createPresignedUploadUrl(params: {
    storageKey: string;
    contentType: string;
    sizeBytes: number;
    expiresInSeconds: number;
  }): Promise<string>;

  headObject(storageKey: string): Promise<S3ObjectHead | null>;

  readObjectBytes(storageKey: string, maxBytes: number): Promise<Uint8Array>;

  deleteObject(storageKey: string): Promise<void>;

  createPresignedDownloadUrl(params: {
    storageKey: string;
    expiresInSeconds: number;
    downloadFilename: string;
  }): Promise<string>;
};
