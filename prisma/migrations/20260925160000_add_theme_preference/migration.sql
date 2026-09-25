-- CreateEnum
CREATE TYPE "ThemeMode" AS ENUM ('LIGHT', 'DARK', 'SYSTEM');

-- AlterTable
ALTER TABLE "user_preferences" ADD COLUMN "theme" "ThemeMode" NOT NULL DEFAULT 'SYSTEM';
