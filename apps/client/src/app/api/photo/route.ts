import { uploadThingApi } from "@/lib/server/uploadthing";
import type { ServerResponse } from "@repo/types";
import { NextResponse } from "next/server";

export async function DELETE(request: Request) {
  try {
    const { key } = await request.json();

    await uploadThingApi.deleteFiles(key);

    return NextResponse.json<ServerResponse<null>>({ status: "OK", message: "photo deleted", data: null });
  } catch {
    return NextResponse.json<ServerResponse<null>>(
      { status: "INTERNAL SERVER ERROR", message: "Oops! something went wrong", data: null },
      { status: 500 },
    );
  }
}
