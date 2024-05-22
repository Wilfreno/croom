/*
  Warnings:

  - A unique constraint covering the columns `[sender_id,receiver_id]` on the table `FriendRequest` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "FriendRequest_sender_id_receiver_id_key" ON "FriendRequest"("sender_id", "receiver_id");
