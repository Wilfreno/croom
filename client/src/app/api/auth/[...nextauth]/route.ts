import auth_options from "@/lib/auth-options";
import nextAuth from "next-auth/next";

const handler = nextAuth(auth_options);

export { handler as GET, handler as POST };
