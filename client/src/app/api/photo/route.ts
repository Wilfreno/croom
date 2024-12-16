import { upload_thing_api } from "@/lib/server/uploadthing";
import { NextResponse } from "next/server";

export async function DELETE(request: Request) {
  try {
    const { key } = await request.json();

    await upload_thing_api.deleteFiles(key);

    return NextResponse.json({ status: "OK", message: "photo deleted" });
  } catch (error) {
    console.log(error);
    return NextResponse.json({ status: "INTERVAL_SERVER_ERROR", message: "Oops! something went wrong" });
  }
}
