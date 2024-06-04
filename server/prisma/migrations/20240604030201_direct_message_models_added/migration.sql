/*
  Warnings:

  - You are about to drop the column `created_at` on the `DirectMessage` table. All the data in the column will be lost.
  - You are about to drop the column `created_at` on the `Friendship` table. All the data in the column will be lost.
  - You are about to drop the column `created_at` on the `Otp` table. All the data in the column will be lost.
  - You are about to drop the column `created_at` on the `PhotoMessage` table. All the data in the column will be lost.
  - You are about to drop the column `created_at` on the `ProfilePhoto` table. All the data in the column will be lost.
  - You are about to drop the column `created_at` on the `Room` table. All the data in the column will be lost.
  - You are about to drop the column `created_at` on the `RoomMessage` table. All the data in the column will be lost.
  - You are about to drop the column `created_at` on the `TextMessage` table. All the data in the column will be lost.
  - You are about to drop the column `created_at` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `created_at` on the `VideoMessage` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "DirectMessage" DROP COLUMN "created_at",
ADD COLUMN     "date_created" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "opend" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Friendship" DROP COLUMN "created_at",
ADD COLUMN     "date_created" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "Otp" DROP COLUMN "created_at",
ADD COLUMN     "date_created" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "PhotoMessage" DROP COLUMN "created_at",
ADD COLUMN     "date_created" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "ProfilePhoto" DROP COLUMN "created_at",
ADD COLUMN     "date_created" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "Room" DROP COLUMN "created_at",
ADD COLUMN     "date_created" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "RoomMessage" DROP COLUMN "created_at",
ADD COLUMN     "date_created" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "TextMessage" DROP COLUMN "created_at",
ADD COLUMN     "date_created" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "created_at",
ADD COLUMN     "date_created" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "VideoMessage" DROP COLUMN "created_at",
ADD COLUMN     "date_created" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
