import { NextResponse, type NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request });
  const path_name = request.nextUrl.pathname;
  const client_url = process.env.CLIENT_URL!;

  try {
    if (!client_url)
      throw new Error("CLIENT_URL is missing from your .env.local file");

    if (
      !token &&
      !path_name.startsWith("/login") &&
      !path_name.startsWith("/signup")
    )
      return NextResponse.redirect(client_url + "/login");

    if (
      path_name.startsWith("/login") ||
      path_name.startsWith("/signup") ||
      path_name.startsWith("/new")
    )
      if (token?.user_name && token.display_name)
        return NextResponse.redirect(
          client_url + "/" + token?.user_name + "/notes"
        );

    if (
      !path_name.startsWith("/new") &&
      !path_name.startsWith("/login") &&
      !path_name.startsWith("/signup") &&
      !token?.user_name &&
      !token?.display_name
    )
      return NextResponse.redirect(client_url + "/new");

    if (path_name === "/" && token?.user_name)
      return NextResponse.redirect(client_url + "/" + token.user_name);

    if (path_name === "/" + token?.user_name)
      return NextResponse.redirect(
        client_url + "/" + token?.user_name + "/notes"
      );
  } catch (error) {
    throw error;
  }
}

export const config = {
  matcher: ["/((?!api|_next/static|favicon.ico).*)"],
};
