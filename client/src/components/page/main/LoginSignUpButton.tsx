"use client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useSearchParams } from "next/navigation";

export default function LoginSignUpButton() {
  const from = useSearchParams().get("from");

  let search_params = "";

  if (from) search_params += "?from=" + from;
  return (
    <div className="space-x-4">
      <Link href={"/sign-up" + search_params}>
        <Button variant="secondary" size="sm">
          Sign Up
        </Button>
      </Link>
      <Link href={"/login" + search_params}>
        <Button size="lg">Login</Button>
      </Link>
    </div>
  );
}
