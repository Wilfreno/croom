"use client";
import auth_options from "@/lib/auth-options";
import { getServerSession } from "next-auth";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";

export default async function page() {
  const { status, data } = useSession();
  if (status === "authenticated" && data) {
    redirect("/" + data.user.user_name);
  }
}
