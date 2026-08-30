"use client";
import { useAuth } from "@/components/providers/AuthProvider";
import Loading from "@/components/svg/Loading";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GETRequest } from "@/lib/server/requests";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

export default function Page() {
  const [email, setEmail] = useState("");
  const [userCheck, setUserCheck] = useState<{ checking: boolean; status?: "NOT_FOUND" | "INVALID" }>({
    checking: false,
  });

  const {
    signup: { createOTP },
  } = useAuth();

  const router = useRouter();

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setUserCheck((prev) => ({ ...prev, checking: true }));

    const pattern = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
    if (!pattern.test(email)) {
      setUserCheck({ checking: false, status: "INVALID" });
      return;
    }

    const { status, message } = await GETRequest("/v1/user/check/email/" + email);
    if (status === "OK") {
      try {
        await createOTP(email, "RECOVER");
        router.push("/recover/" + email);
        setUserCheck({ checking: false });
      } catch (error) {
        throw error;
      }
      return;
    }

    if (status === "NOT_FOUND") {
      setUserCheck({ checking: false, status: "NOT_FOUND" });
      return;
    }

    throw { status, message };
  }

  return (
    <form data-testid="recover-page-form" className="grid gap-4" onSubmit={onSubmit}>
      <Label htmlFor="recover-search-your-email">Search your email</Label>
      <div className="flex items-start gap-2">
        <div className="grid gap-1">
          <div className="relative">
            <Input
              id="recover-search-your-email"
              placeholder="Search your email"
              value={email}
              onChange={(e) => setEmail(e.currentTarget.value)}
              className={cn(
                "w-96",
                (userCheck.status === "NOT_FOUND" || userCheck.status === "INVALID") &&
                  "border-destructive focus-visible:ring-destructive"
              )}
            />
            {userCheck.checking && (
              <Loading
                data-testid="recover-search-email-loading"
                className="absolute aspect-square h-5 w-auto top-1/2 right-2 -translate-y-1/2"
              />
            )}
          </div>
          {userCheck.status === "INVALID" && (
            <span data-testid="recover-email-invalid" className="text-xs text-destructive">
              Invalid email
            </span>
          )}
          {userCheck.status === "NOT_FOUND" && (
            <span data-testid="recover-email-not-found" className="text-xs text-destructive">
              Cannot find email
            </span>
          )}
        </div>
        <Button disabled={!email || userCheck.checking} className="justify-self-center">
          Search
        </Button>
      </div>
    </form>
  );
}
