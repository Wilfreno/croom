import { NextResponse, type NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request });
  const pathname = request.nextUrl.pathname;
  const client_url = process.env.CLIENT_URL!;

  try {
    if (!client_url)
      throw new Error("CLIENT_URL is missing from your .env.local file");

    if (!token) {
      if (!pathname.startsWith("/login") && !pathname.startsWith("/signup"))
        return NextResponse.redirect(client_url + "/login");
    } else {
      if (
        (!token?.user_name || !token.display_name) &&
        !pathname.startsWith("/new")
      )
        return NextResponse.redirect(client_url + "/new");

      if (pathname.startsWith("/login") && pathname.startsWith("/signup"))
        return NextResponse.redirect(
          client_url + "/" + token?.user_name + "/notes"
        );
      if (pathname === "/" || pathname === "/" + token?.user_name)
        return NextResponse.redirect(
          client_url + "/" + token?.user_name + "/notes"
        );
    }
  } catch (error) {
    throw error;
  }
}

export const config = {
  matcher: ["/((?!api|_next/static|favicon.ico).*)"],
};
