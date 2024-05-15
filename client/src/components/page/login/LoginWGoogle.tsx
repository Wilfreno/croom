"use client";

import { Button } from "@/components/ui/button";
import { signIn } from "next-auth/react";

export default function LoginWGoogle() {
  return (
    <Button
      variant="secondary"
      className="aspect-square w-fit h-auto text-base"
      onClick={async () =>
        await signIn("google", {
          redirect: true,
          callbackUrl: "/",
        })
      }
    >
      G
    </Button>
  );
}
