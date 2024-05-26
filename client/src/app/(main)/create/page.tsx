"use client";
import { Button } from "@/components/ui/button";
import { signOut, useSession } from "next-auth/react";

export default function page() {
  const { data } = useSession();
  console.log(data);
  return <Button onClick={() => signOut()}>Logout</Button>;
}
