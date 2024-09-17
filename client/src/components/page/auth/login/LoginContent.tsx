"use client";
import React from "react";
import LoginForm from "./LoginForm";
import LoginWGoogle from "./LoginGoogle";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useSearchParams } from "next/navigation";

export default function LoginContent() {
  const from = useSearchParams().get("from");

  let search_params = "";
  if (from) search_params += "?from=" + from;

  return (
    <>
      <span className="grid gap-4">
        <LoginForm />
        <LoginWGoogle />
      </span>
      <span className="text-sm">
        Don&apos;t have an account?
        <Link href={"/sign-up" + search_params} className="text-primary">
          <Button variant="link">Sign Up</Button>
        </Link>
      </span>
    </>
  );
}
