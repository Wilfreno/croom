-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "first_name" TEXT NOT NULL,
    "middle_name" TEXT,
    "last_name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "room_id" TEXT,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Room" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Room_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Photo" (
    "id" TEXT NOT NULL,
    "owner_id" TEXT,
    "message_id" TEXT,
    "photo_url" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Photo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Message" (
    "id" TEXT NOT NULL,
    "owner_id" TEXT,
    "room_id" TEXT,
    "type" TEXT NOT NULL,
    "text" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Video" (
    "id" TEXT NOT NULL,
    "owner_id" TEXT NOT NULL,
    "message_id" TEXT NOT NULL,
    "video_url" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "length" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Video_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_id_key" ON "User"("id");

-- CreateIndex
CREATE UNIQUE INDEX "Room_id_key" ON "Room"("id");

-- CreateIndex
CREATE UNIQUE INDEX "Photo_id_key" ON "Photo"("id");

-- CreateIndex
CREATE UNIQUE INDEX "Photo_owner_id_key" ON "Photo"("owner_id");

-- CreateIndex
CREATE UNIQUE INDEX "Message_id_key" ON "Message"("id");

-- CreateIndex
CREATE UNIQUE INDEX "Video_id_key" ON "Video"("id");

-- CreateIndex
CREATE UNIQUE INDEX "Video_message_id_key" ON "Video"("message_id");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "Room"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Photo" ADD CONSTRAINT "Photo_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Photo" ADD CONSTRAINT "Photo_message_id_fkey" FOREIGN KEY ("message_id") REFERENCES "Message"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "Room"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Video" ADD CONSTRAINT "Video_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Video" ADD CONSTRAINT "Video_message_id_fkey" FOREIGN KEY ("message_id") REFERENCES "Message"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
