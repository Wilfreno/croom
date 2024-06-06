/*
  Warnings:

  - You are about to drop the column `opend` on the `DirectMessage` table. All the data in the column will be lost.
  - Added the required column `type` to the `DirectMessage` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "DirectMessage" DROP COLUMN "opend",
ADD COLUMN     "seen" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "type" TEXT NOT NULL;
