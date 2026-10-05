-- AlterTable
ALTER TABLE "notes" ADD COLUMN "archived_at" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "notes_user_id_archived_at_idx" ON "notes"("user_id", "archived_at");
