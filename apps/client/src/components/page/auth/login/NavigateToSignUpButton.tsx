"use client";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

export default function NavigateToSignUpButton() {
  const from = useSearchParams().get("from");

  let searchParams = "";
  if (from) searchParams += "?from=" + from;

  return (
    <div className="flex items-center gap-2">
      <span>Don&apos;t have an account?</span>
      <Link href={"/sign-up" + searchParams} className="text-primary hover:underline underline-offset-4" prefetch>
        Sign Up
      </Link>
    </div>
  );
}
