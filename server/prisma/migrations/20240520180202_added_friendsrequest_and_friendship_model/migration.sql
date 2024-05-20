/*
  Warnings:

  - You are about to drop the `_friends` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "_friends" DROP CONSTRAINT "_friends_A_fkey";

-- DropForeignKey
ALTER TABLE "_friends" DROP CONSTRAINT "_friends_B_fkey";

-- DropTable
DROP TABLE "_friends";

-- CreateTable
CREATE TABLE "FriendRequest" (
    "receiver_id" TEXT NOT NULL,
    "sender_id" TEXT NOT NULL,

    CONSTRAINT "FriendRequest_pkey" PRIMARY KEY ("receiver_id","sender_id")
);

-- CreateTable
CREATE TABLE "Friendship" (
    "id" TEXT NOT NULL,
    "friend_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Friendship_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Friendship_id_key" ON "Friendship"("id");

-- AddForeignKey
ALTER TABLE "FriendRequest" ADD CONSTRAINT "FriendRequest_receiver_id_fkey" FOREIGN KEY ("receiver_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FriendRequest" ADD CONSTRAINT "FriendRequest_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Friendship" ADD CONSTRAINT "Friendship_friend_id_fkey" FOREIGN KEY ("friend_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
