import { NextResponse, type NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request });
  const path_name = request.nextUrl.pathname;
  const dev_url = process.env.DEVELOPMENT_URL!;
  const production_url = process.env.PRODUCTION_URL!;

  try {
    if (!dev_url && !production_url)
      throw new Error(
        "DEVELOPMENT_URL or PRODUCTION_URL is missing from your .env.local file"
      );

    if (
      !token &&
      !path_name.startsWith("/login") &&
      !path_name.startsWith("/signup")
    )
      return process.env.NODE_ENV === "development"
        ? NextResponse.redirect(dev_url + "/login")
        : NextResponse.redirect(production_url + "/login");

    if (
      path_name.startsWith("/login") ||
      path_name.startsWith("/signup") ||
      path_name.startsWith("/new")
    )
      if (token?.user_name && token.display_name)
        return process.env.NODE_ENV === "development"
          ? NextResponse.redirect(dev_url + "/" + token?.user_name + "/notes")
          : NextResponse.redirect(
              production_url + "/" + token?.user_name + "/notes"
            );

    if (
      !path_name.startsWith("/new") &&
      !path_name.startsWith("/login") &&
      !path_name.startsWith("/signup") &&
      !token?.user_name &&
      !token?.display_name
    )
      return process.env.NODE_ENV === "development"
        ? NextResponse.redirect(dev_url + "/new")
        : NextResponse.redirect(production_url + "/new");

    if (path_name === "/" && token?.user_name)
      return process.env.NODE_ENV === "development"
        ? NextResponse.redirect(dev_url + "/" + token.user_name)
        : NextResponse.redirect(production_url + "/" + token.user_name);

    if (path_name === "/" + token?.user_name)
      return process.env.NODE_ENV === "development"
        ? NextResponse.redirect(dev_url + "/" + token?.user_name + "/notes")
        : NextResponse.redirect(
            production_url + "/" + token?.user_name + "/notes"
          );
  } catch (error) {
    throw error;
  }
}

export const config = {
  matcher: ["/((?!api|_next/static|favicon.ico).*)"],
};
