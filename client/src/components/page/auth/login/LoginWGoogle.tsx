"use client";

import { useAuth } from "@/components/providers/AuthProvider";
import GoogleSvg from "@/components/svg/GoogleSvg";
import { Button } from "@/components/ui/button";

export default function LoginWGoogle() {
  const { login } = useAuth();

  return (
    <Button
      variant="secondary"
      onClick={async () => {
        await login("GOOGLE");
      }}
      className="gap-4 w-full"
    >
      <span>Continue with Google</span>
      <GoogleSvg className="h-6 w-auto" />
    </Button>
  );
}
