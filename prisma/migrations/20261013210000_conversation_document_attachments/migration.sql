-- AlterTable
ALTER TABLE "conversations"
ADD COLUMN "attached_document_ids" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "attachment_include_notes" BOOLEAN NOT NULL DEFAULT false;
