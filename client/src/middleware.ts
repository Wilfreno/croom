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

    console.log("token", token);
    if (!token && !path_name.startsWith("/login"))
      return process.env.NODE_ENV === "development"
        ? NextResponse.redirect(dev_url + "/login")
        : NextResponse.redirect(production_url + "/login");

    if (path_name.startsWith("/login") && token)
      return process.env.NODE_ENV === "development"
        ? NextResponse.redirect(dev_url)
        : NextResponse.redirect(production_url);

      
  } catch (error) {
    throw error;
  }
}

export const config = {
  matcher: ["/((?!api|_next/static|favicon.ico).*)"],
};
