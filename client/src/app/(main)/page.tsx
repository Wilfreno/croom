"use client";
import auth_options from "@/lib/auth-options";
import { getServerSession } from "next-auth";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";

export default async function page() {
<<<<<<< HEAD
  const session = await getServerSession(auth_options);

  if (session) {
    redirect("/" + session.user.user_name);
=======
  const { status, data } = useSession();
  if (status === "authenticated" && data) {
    redirect("/" + data.user.user_name);
>>>>>>> 3b4fbc26f266d4969c19884f81ea1a7ac1cc742c
  }
}
