-- CreateEnum
CREATE TYPE "AvatarType" AS ENUM ('INITIALS', 'EMOJI', 'IMAGE');

-- AlterTable
ALTER TABLE "users" ADD COLUMN "avatar_type" "AvatarType" NOT NULL DEFAULT 'INITIALS';
ALTER TABLE "users" ADD COLUMN "avatar_emoji" TEXT;
ALTER TABLE "users" ADD COLUMN "avatar_background" TEXT;
ALTER TABLE "users" ADD COLUMN "avatar_image_url" TEXT;
