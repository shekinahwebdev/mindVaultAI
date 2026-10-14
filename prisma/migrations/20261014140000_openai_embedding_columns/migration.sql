-- AlterTable
ALTER TABLE "note_embeddings" ADD COLUMN "openai_embedding" vector(768),
ADD COLUMN "openai_model" TEXT,
ADD COLUMN "openai_dimensions" INTEGER;

-- AlterTable
ALTER TABLE "document_chunks" ADD COLUMN "openai_embedding" vector(768),
ADD COLUMN "openai_embedding_model" TEXT,
ADD COLUMN "openai_embedding_dimensions" INTEGER;

-- CreateTable
CREATE TABLE "embedding_migration_checkpoints" (
    "key" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "embedding_migration_checkpoints_pkey" PRIMARY KEY ("key")
);
