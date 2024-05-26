import auth_options from "@/lib/auth-options";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

export default async function page() {
  const session = await getServerSession(auth_options);

  if (session) {
    if (session.user.provider) redirect("/new");
    redirect("/" + session.user.user_name);
  }
}
