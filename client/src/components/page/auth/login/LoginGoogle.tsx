"use client";

import GoogleSvg from "@/components/svg/GoogleSvg";
import { Button } from "@/components/ui/button";
import { signIn } from "next-auth/react";
import { toast } from "sonner";

export default function LoginWGoogle() {
  return (
    <Button
      variant="secondary"
      onClick={async () => {
        const response = await signIn("google", {
          redirect: false,
        });
        if (response?.error) toast.error(response.error);
      }}
      className="gap-4"
    >
      <span>Continue with Google</span>
      <GoogleSvg className="h-6 w-auto" />
    </Button>
  );
}
