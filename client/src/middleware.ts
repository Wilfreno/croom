import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";

export async function middleware(request: NextRequest) {
  const from = request.nextUrl.searchParams.get("from");
  const pathname = request.nextUrl.pathname;
  const origin = request.nextUrl.origin;

  let search_params = "";

  if (from) search_params += "?from=" + from;

  try {
    const token = await getToken({ req: request });

    if (!token) {
      if (!pathname.startsWith("/login") && !pathname.startsWith("/welcome") && !pathname.startsWith("/sign-up")) {
        NextResponse.json({ message: "user unauthenticated" }, { status: 401 });
        return NextResponse.redirect(origin + "/welcome" + search_params);
      }
    } else {
      if (pathname.startsWith("/login") || pathname.startsWith("/sign-up") || pathname.startsWith("/welcome")) {
        return NextResponse.redirect(origin + "/" + (search_params ? search_params : ""));
      }
    }
  } catch (error) {
    throw error;
  }
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|.*\\.png$).*)"],
};
