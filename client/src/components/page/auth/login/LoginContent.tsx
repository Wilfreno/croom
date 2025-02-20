"use client";
import React from "react";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useSearchParams } from "next/navigation";
import LoginForm from "./LoginForm";
import LoginWGoogle from "./LoginWGoogle";

export default function LoginContent() {
  const from = useSearchParams().get("from");

  let search_params = "";
  if (from) search_params += "?from=" + from;

  return (
    <section className="grow grid grid-rows-[1fr_auto] pb-10 md:gap-8 ">
      <span className="flex flex-col justify-center gap-4 p-4">
        <LoginForm />
        <LoginWGoogle />
      </span>
      <span className="justify-self-center">
        Don&apos;t have an account?
        <Link href={"/sign-up" + search_params} className="text-primary" prefetch>
          <Button variant="link">Sign Up</Button>
        </Link>
      </span>
    </section>
  );
}
