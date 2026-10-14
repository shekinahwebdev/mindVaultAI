-- CreateTable
CREATE TABLE "document_chunks" (
    "id" TEXT NOT NULL,
    "document_id" TEXT NOT NULL,
    "processing_version" INTEGER NOT NULL,
    "chunk_index" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "page_start" INTEGER NOT NULL,
    "page_end" INTEGER NOT NULL,
    "character_count" INTEGER NOT NULL,
    "token_count" INTEGER,
    "embedding_model" TEXT,
    "embedding_dimensions" INTEGER,
    "embedding" vector(768),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "document_chunks_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "documents" ADD COLUMN "processing_stage" TEXT,
ADD COLUMN "processing_total_chunks" INTEGER,
ADD COLUMN "processing_completed_chunks" INTEGER;

-- CreateIndex
CREATE UNIQUE INDEX "document_chunks_document_id_processing_version_chunk_index_key" ON "document_chunks"("document_id", "processing_version", "chunk_index");

-- CreateIndex
CREATE INDEX "document_chunks_document_id_processing_version_idx" ON "document_chunks"("document_id", "processing_version");

-- AddForeignKey
ALTER TABLE "document_chunks" ADD CONSTRAINT "document_chunks_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;
