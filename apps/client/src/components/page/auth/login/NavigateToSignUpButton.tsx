"use client";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

export default function NavigateToSignUpButton() {
  const from = useSearchParams().get("from");

  let search_params = "";
  if (from) search_params += "?from=" + from;

  return (
    <div className="flex items-center gap-2">
      <span>Don&apos;t have an account?</span>
      <Link href={"/sign-up" + search_params} className="text-primary hover:underline underline-offset-4" prefetch>
        Sign Up
      </Link>
    </div>
  );
}
