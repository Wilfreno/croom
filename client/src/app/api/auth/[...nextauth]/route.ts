import auth_options from "@/lib/auth/next-auth";
import nextAuth from "next-auth/next";

const handler = nextAuth(auth_options);

export { handler as GET, handler as POST };
