"use client";

import { useAuth } from "@/components/providers/SessionProvider";
import GoogleSvg from "@/components/svg/GoogleSvg";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function LoginWGoogle() {
  const { login, error } = useAuth();

  return (
    <Button
      variant="secondary"
      onClick={async () => {
        await login("GOOGLE");
        if (error) toast.error(error);
      }}
      className="gap-4"
    >
      <span>Continue with Google</span>
      <GoogleSvg className="h-6 w-auto" />
    </Button>
  );
}
