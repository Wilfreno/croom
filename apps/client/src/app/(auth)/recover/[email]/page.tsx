"use client";
import { useAuth } from "@/components/providers/AuthProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Label } from "@/components/ui/label";
import { PATCHRequest, POSTRequest } from "@/lib/server/requests";
import { cn } from "@/lib/utils";
import { useMutation } from "@tanstack/react-query";
import { REGEXP_ONLY_DIGITS_AND_CHARS } from "input-otp";
import { ArrowLeft, Check, Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function Page() {
  const [pin, setPin] = useState("");
  const [resend, setResend] = useState<{
    time: number;
    open: boolean;
    interval_id?: NodeJS.Timeout;
  }>({ time: 30, open: true });
  const [password, setPassword] = useState(["", ""]);
  const [see_password, setSeePassword] = useState([false, false]);

  const params = useParams<{ email: string }>();
  const router = useRouter();

  const otp_check = useMutation({
    mutationFn: async () => {
      try {
        const { status, message } = await POSTRequest("/v1/otp/check/recover", {
          email: decodeURIComponent(params.email),
          pin,
        });

        if (status !== "OK") {
          throw new Error(message);
        }
      } catch (error) {
        throw error;
      }
    },
  });

  const change_password = useMutation({
    mutationFn: async () => {
      try {
        const { status, message } = await PATCHRequest("/v1/user/recover", {
          email: decodeURIComponent(params.email),
          pin,
          password,
        });

        if (status !== "OK") throw new Error(message);
      } catch (error) {
        toast.error((error as Error).message);
        throw error;
      }
    },
  });

  const {
    signup: { createOTP },
  } = useAuth();

  async function handleResend() {
    const id = setInterval(() => {
      setResend((prev) => ({ ...prev, time: prev.time - 1 }));
    }, 1000);
    setResend((prev) => ({ ...prev, open: false, interval_id: id }));
    await createOTP(decodeURIComponent(params.email), "RECOVER");
    setResend((prev) => ({ ...prev, interval_id: id }));
  }

  useEffect(() => {
    if (resend.time < 1) {
      clearInterval(resend.interval_id);
      setResend({ time: 30, open: true });
    }
  }, [resend.time]);

  if (change_password.isSuccess)
    return (
      <section className="flex flex-col gap-20">
        <div className="grid place-items-center gap-8">
          <h1 className="text-2xl font-medium">Password Changed</h1>
          <Check className="h-20 w-auto text-green-500 stroke-2 bg-secondary rounded-full" />
        </div>
        <Button size="lg" variant="link" className="text-xl">
          <Link href="/login">Login</Link>
        </Button>
      </section>
    );

  return (
    <section className="grid gap-8">
      <Button
        data-testid="recover-back-button"
        onClick={() => router.push("/recover")}
        variant="link"
        className="w-fit h-fit p-1"
      >
        <ArrowLeft className="h-4 w-auto" />
        <span>Go back</span>
      </Button>
      {otp_check.isSuccess ? (
        <form
          className="grid gap-8 w-96"
          onSubmit={(e) => {
            e.preventDefault();
            change_password.mutate();
          }}
        >
          <div className="grid gap-2 relative">
            <div>
              <Label htmlFor="recover-new-password">New password</Label>
              <div className="relative">
                <Input
                  type={see_password[0] ? "text" : "password"}
                  id="recover-new-password"
                  placeholder="New password"
                  value={password[0]}
                  onChange={(e) => setPassword((prev) => [e.target.value, prev[1]])}
                  className={cn(
                    "pr-12",
                    !!password[0] && password[0].length < 8 && "border-destructive focus-visible:ring-destructive"
                  )}
                />
                <Button
                  type="button"
                  variant="ghost"
                  tabIndex={-1}
                  className="aspect-square h-fit w-auto p-1 absolute top-1/2 right-2 -translate-y-1/2"
                  onClick={() => setSeePassword((prev) => [!prev[0], prev[1]])}
                >
                  {see_password[0] ? <Eye className="h-full w-full" /> : <EyeOff className="h-full w-full" />}
                </Button>
              </div>
            </div>
            <div>
              <Label htmlFor="recover-confirm-password">Confirm password</Label>
              <div className="relative">
                <Input
                  type={see_password[1] ? "text" : "password"}
                  id="recover-confirm-password"
                  placeholder="Confirm password"
                  value={password[1]}
                  onChange={(e) => setPassword((prev) => [prev[0], e.target.value])}
                  className={cn(
                    "pr-12",
                    password[1] &&
                      password[0].length >= 8 &&
                      password[0] !== password[1] &&
                      "border-destructive focus-visible:ring-destructive"
                  )}
                />
                <Button
                  type="button"
                  variant="ghost"
                  tabIndex={-1}
                  className="aspect-square h-fit w-auto p-1 absolute top-1/2 right-2 -translate-y-1/2"
                  onClick={() => setSeePassword((prev) => [prev[0], !prev[1]])}
                >
                  {see_password[1] ? <Eye className="h-full w-full" /> : <EyeOff className="h-full w-full" />}
                </Button>
              </div>
            </div>
            {!!password[0] && password[0].length < 8 && (
              <span className="text-xs text-destructive absolute -bottom-4">
                Password must be 8 or more characters longer
              </span>
            )}
            {password[1] && password[0].length >= 8 && password[0] !== password[1] && (
              <span className="text-xs text-destructive  absolute -bottom-4">Password is not the same</span>
            )}
          </div>

          <Button disabled={!password[0] || !password[1] || password[0].length < 8 || password[0] !== password[1]}>
            Change password
          </Button>
        </form>
      ) : (
        <form
          data-testid="recover-otp-form"
          className="grid gap-8"
          onSubmit={(event) => {
            event.preventDefault();
            otp_check.mutate();
          }}
        >
          <div className="grid gap-16">
            <header>
              <span>An email is sent to </span>
              <span className="font-medium">{decodeURIComponent(params.email)}</span>
              <p className="text-xs font-medium text-muted-foreground">(check your spam folder)</p>
            </header>
            <div className="grid gap-4">
              <InputOTP
                data-testid="recover-otp-input"
                maxLength={6}
                pattern={REGEXP_ONLY_DIGITS_AND_CHARS}
                value={pin}
                onChange={(value) => setPin(value.toUpperCase())}
                autoFocus
              >
                <InputOTPGroup className="w-full flex justify-between space-x-5">
                  <InputOTPSlot
                    index={0}
                    className={cn(
                      "aspect-square  md:w-11 h-auto text-base border rounded first:rounded-l",
                      otp_check.isError && "border-destructive"
                    )}
                  />
                  <InputOTPSlot
                    index={1}
                    className={cn(
                      "aspect-square  md:w-11 h-auto text-base border rounded",
                      otp_check.isError && "border-destructive"
                    )}
                  />
                  <InputOTPSlot
                    index={2}
                    className={cn(
                      "aspect-square  md:w-11 h-auto text-base border rounded",
                      otp_check.isError && "border-destructive"
                    )}
                  />
                  <InputOTPSlot
                    index={3}
                    className={cn(
                      "aspect-square  md:w-11 h-auto text-base border rounded",
                      otp_check.isError && "border-destructive"
                    )}
                  />
                  <InputOTPSlot
                    index={4}
                    className={cn(
                      "aspect-square  md:w-11 h-auto text-base border rounded",
                      otp_check.isError && "border-destructive"
                    )}
                  />
                  <InputOTPSlot
                    index={5}
                    className={cn(
                      "aspect-square  md:w-11 h-auto text-base border rounded last:rounded-r",
                      otp_check.isError && "border-destructive"
                    )}
                  />
                </InputOTPGroup>
              </InputOTP>
              {otp_check.isError && (
                <span data-testid="recover-invalid-pin" className="text-xs text-destructive font-medium">
                  {otp_check.error.message}
                </span>
              )}
            </div>
          </div>
          <Button
            data-testid="recover-otp-resend"
            disabled={!resend.open}
            type="button"
            variant="ghost"
            className="w-fit h-fit mx-auto p-1 text-xs text-muted-foreground"
            onClick={handleResend}
          >
            <span>resend</span>
            {!resend.open && <span>({resend.time})</span>}
          </Button>
          <Button disabled={pin.length < 6} data-testid="recover-otp-confirm">
            Confirm
          </Button>
        </form>
      )}
    </section>
  );
}
