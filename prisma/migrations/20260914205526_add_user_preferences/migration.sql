-- CreateEnum
CREATE TYPE "SearchMode" AS ENUM ('KEYWORD', 'SEMANTIC');

-- CreateTable
CREATE TABLE "user_preferences" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "default_note_type" "NoteType" NOT NULL DEFAULT 'NOTE',
    "default_category_id" TEXT,
    "default_search_mode" "SearchMode" NOT NULL DEFAULT 'KEYWORD',
    "ai_assistance_enabled" BOOLEAN NOT NULL DEFAULT true,
    "rag_enabled" BOOLEAN NOT NULL DEFAULT true,
    "reduced_motion" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_preferences_user_id_key" ON "user_preferences"("user_id");

-- AddForeignKey
ALTER TABLE "user_preferences" ADD CONSTRAINT "user_preferences_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
