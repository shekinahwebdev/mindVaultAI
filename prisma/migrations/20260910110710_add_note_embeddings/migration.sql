-- Required before any `vector(n)` column can be created. Safe to re-run
-- (IF NOT EXISTS) on a database that already has it, e.g. a manually
-- provisioned Postgres instance.
CREATE EXTENSION IF NOT EXISTS vector;

-- CreateTable
CREATE TABLE "note_embeddings" (
    "id" TEXT NOT NULL,
    "note_id" TEXT NOT NULL,
    "embedding" vector(768) NOT NULL,
    "model" TEXT NOT NULL,
    "dimensions" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "note_embeddings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "note_embeddings_note_id_key" ON "note_embeddings"("note_id");

-- AddForeignKey
ALTER TABLE "note_embeddings" ADD CONSTRAINT "note_embeddings_note_id_fkey" FOREIGN KEY ("note_id") REFERENCES "notes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- No HNSW/IVFFlat index yet: both are approximate-nearest-neighbor indexes
-- that only pay off once there are enough rows to build meaningful graph/
-- cluster structure (thousands+). At today's note counts an exact
-- sequential scan over `<=>` is fast and, unlike ANN, always exact. Add
-- one (`CREATE INDEX ... USING hnsw (embedding vector_cosine_ops)`) in a
-- follow-up migration once note volume justifies it.
