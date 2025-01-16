"use client";

<<<<<<< HEAD
import { useAuth } from "@/components/providers/SessionProvider";
import GoogleSvg from "@/components/svg/GoogleSvg";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function LoginWGoogle() {
  const { login, error } = useAuth();

=======
import GoogleSvg from "@/components/svg/GoogleSvg";
import { Button } from "@/components/ui/button";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";

export default function LoginWGoogle() {
  const from = useSearchParams().get("from");
>>>>>>> 48594df86b677d2b1222ce8220c48d5ef0822e60
  return (
    <Button
      variant="secondary"
      onClick={async () => {
<<<<<<< HEAD
        await login("GOOGLE");
        if (error) toast.error(error);
=======
        const response = await signIn("google", {
          redirect: true,
          callbackUrl: from ? from : "/",
        });
        if (response?.error) toast.error(response.error);
>>>>>>> 48594df86b677d2b1222ce8220c48d5ef0822e60
      }}
      className="gap-4"
    >
      <span>Continue with Google</span>
      <GoogleSvg className="h-6 w-auto" />
    </Button>
  );
}
