import { uploadThingApi } from "@/lib/server/uploadthing";
import { NextResponse } from "next/server";

export async function DELETE(request: Request) {
  try {
    const { key } = await request.json();

    await uploadThingApi.deleteFiles(key);

    return NextResponse.json({ status: "OK", message: "photo deleted" });
  } catch (error) {
    return NextResponse.json({ status: "INTERVAL_SERVER_ERROR", message: "Oops! something went wrong" });
  }
}
