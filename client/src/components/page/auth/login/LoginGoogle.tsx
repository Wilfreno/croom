"use client";

import { Button } from "@/components/ui/button";
import { signIn } from "next-auth/react";
import { toast } from "sonner";

export default function LoginWGoogle() {
  return (
    <Button
      variant="secondary"
      className="aspect-square w-fit h-auto text-base font-bold"
      onClick={async () => {
        const response = await signIn("google", {
          redirect: false,
        });
        if (response?.error) toast.error(response.error);
      }}
    >
      G
    </Button>
  );
}
