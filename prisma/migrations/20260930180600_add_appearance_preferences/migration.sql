-- CreateEnum
CREATE TYPE "AccentColor" AS ENUM ('BLUE', 'PURPLE', 'RED', 'ORANGE', 'YELLOW', 'GREEN', 'PINK');
CREATE TYPE "InterfaceDensity" AS ENUM ('COMFORTABLE', 'COMPACT', 'MINIMAL');
CREATE TYPE "UiFontFamily" AS ENUM ('INTER', 'GEIST', 'SYSTEM');

-- AlterTable
ALTER TABLE "user_preferences" ADD COLUMN "accent_color" "AccentColor" NOT NULL DEFAULT 'BLUE';
ALTER TABLE "user_preferences" ADD COLUMN "interface_density" "InterfaceDensity" NOT NULL DEFAULT 'COMFORTABLE';
ALTER TABLE "user_preferences" ADD COLUMN "font_family" "UiFontFamily" NOT NULL DEFAULT 'GEIST';
