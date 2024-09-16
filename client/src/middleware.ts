import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";

export async function middleware(request: NextRequest) {
  const from = request.nextUrl.searchParams.get("from");
  const pathname = request.nextUrl.pathname;
  const client_url = process.env.CLIENT_URL;

  if (!client_url)
    throw new Error("CLIENT_URL is missing from your .env.local file");
  try {
    const token = await getToken({ req: request });

    if (!token) {
      if (!pathname.startsWith("/login") || !pathname.startsWith("/welcome")) {
        NextResponse.json({ message: "user unauthenticated" }, { status: 401 });
        return NextResponse.redirect(
          client_url + "/welcome" + "?from=" + (from ? from : pathname)
        );
      }
    } else {
      if (token.new && !pathname.startsWith("/new"))
        return NextResponse.redirect(client_url + "/new");
      if (pathname.startsWith("/login") || pathname.startsWith("/sign-up")) {
        return NextResponse.redirect(client_url + (from ? from : "/"));
      }
    }
  } catch (error) {
    throw error;
  }
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|.*\\.png$).*)"],
};
