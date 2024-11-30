"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

export default function AuthButtons() {
  const from = useSearchParams().get("from");

  let search_params = "";

  if (from) search_params += "?from=" + from;

  return (
    <section className="flex justify-center gap-8">
      <Link href={"/login" + search_params}>
        <Button size="lg">Login</Button>
      </Link>
      <Link href={"/sign-up" + search_params}>
        <Button variant="secondary">Sign up</Button>
      </Link>
    </section>
  );
}
