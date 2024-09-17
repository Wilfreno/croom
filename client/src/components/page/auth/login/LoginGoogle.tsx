"use client";

import GoogleSvg from "@/components/svg/GoogleSvg";
import { Button } from "@/components/ui/button";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";

export default function LoginWGoogle() {
  const from = useSearchParams().get("from");
  return (
    <Button
      variant="secondary"
      onClick={async () => {
        const response = await signIn("google", {
          redirect: true,
          callbackUrl: from ? from : "/",
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
