import { useAuth } from "@/components/providers/AuthProvider";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { cn } from "@/lib/utils";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { REGEXP_ONLY_DIGITS_AND_CHARS } from "input-otp";
import { Snail } from "lucide-react";
import { useEffect, useState } from "react";

export default function SignUpDialog() {
  const [creating_otp, setCreatingOTP] = useState(false);
  const [submitting_form, setSubmittingForm] = useState(false);

  const [resend, setResend] = useState<{
    time: number;
    open: boolean;
    interval_id?: NodeJS.Timeout;
  }>({ time: 30, open: true });

  const {
    signup: { createOTP, submitForm },
  } = useAuth();

  const query_client = useQueryClient();
  const { data: form } = useQuery<{
    email: string;
    username: string;
    password: string;
    display_name: string;
    confirm_password: string;
    pin: string;
  }>({ queryKey: ["signup", "form"] });

  const { data: email_check } = useQuery<{ checking: boolean; status?: "ALREADY_USED" | "AVAILABLE" | "INVALID" }>({
    queryKey: ["signup", "form", "email", "check"],
  });

  async function handleResend() {
    const id = setInterval(() => {
      setResend((prev) => ({ ...prev, time: prev.time - 1 }));
    }, 1000);
    setResend((prev) => ({ ...prev, open: false, interval_id: id }));
    await createOTP(form!.email, "SIGNUP");
    setResend((prev) => ({ ...prev, interval_id: id }));
  }

  useEffect(() => {
    if (resend.time < 1) {
      clearInterval(resend.interval_id);
      setResend({ time: 30, open: true });
    }
  }, [resend.time]);

  return (
    <Dialog
      onOpenChange={async (e) => {
        if (!e) return;
        setCreatingOTP(true);
        await createOTP(form!.email, "SIGNUP");
        setCreatingOTP(false);
      }}
    >
      <DialogTrigger asChild>
        <Button
          type="button"
          disabled={
            !form?.email ||
            !form?.username ||
            !form?.password ||
            form?.password.length < 8 ||
            !form?.confirm_password ||
            form?.password !== form?.confirm_password ||
            email_check?.status !== "AVAILABLE"
          }
        >
          Submit
        </Button>
      </DialogTrigger>
      <DialogContent className={cn("w-[32rem]", (creating_otp || submitting_form) && "grid place-items-center ")}>
        <DialogHeader>
          <DialogTitle></DialogTitle>
        </DialogHeader>
        {creating_otp ? (
          <>
            <Snail className="h-24 w-auto stroke-1 stroke-primary/80 animate-pulse" />
            <p className="font-semibold text-primary animate-pulse">Sending OTP</p>
          </>
        ) : submitting_form ? (
          <>
            <Snail className="h-24 w-auto stroke-1 stroke-primary/80 animate-pulse" />
            <p className="font-medium text-primary animate-pulse">Creating new user</p>
          </>
        ) : (
          <>
            <div className="grid">
              <DialogClose asChild className="absolute top-2 right-2">
                <Button variant="outline">Back</Button>
              </DialogClose>
              <p className="">An OTP was sent to your email:</p>
              <p className="italic font-medium">{form?.email ? form?.email : "user@example.com"}</p>
              <div className="my-5">
                <p> Please check your inbox.</p>
                <p className="text-xs font-medium text-muted-foreground">or check your spam section</p>
              </div>
            </div>
            <InputOTP
              maxLength={6}
              pattern={REGEXP_ONLY_DIGITS_AND_CHARS}
              value={form?.pin}
              onChange={(value) =>
                query_client.setQueryData<{
                  email: string;
                  username: string;
                  password: string;
                  display_name: string;
                  confirm_password: string;
                  pin: string;
                }>(["signup", "form"], (prev) => {
                  if (!prev) return;
                  return { ...prev, pin: value.toUpperCase() };
                })
              }
              autoFocus
            >
              <InputOTPGroup className="w-full flex justify-between space-x-5">
                <InputOTPSlot
                  index={0}
                  className="aspect-square  md:w-11 h-auto text-base border rounded first:rounded-l"
                />
                <InputOTPSlot index={1} className="aspect-square  md:w-11 h-auto text-base border rounded" />
                <InputOTPSlot index={2} className="aspect-square  md:w-11 h-auto text-base border rounded" />
                <InputOTPSlot index={3} className="aspect-square  md:w-11 h-auto text-base border rounded" />
                <InputOTPSlot index={4} className="aspect-square  md:w-11 h-auto text-base border rounded" />
                <InputOTPSlot
                  index={5}
                  className="aspect-square  md:w-11 h-auto text-base border rounded last:rounded-r"
                />
              </InputOTPGroup>
            </InputOTP>
            <Button
              size="sm"
              variant="ghost"
              className="mx-auto"
              disabled={!resend.open}
              type="button"
              onClick={handleResend}
            >
              resend {!resend.open && "(" + resend.time + ")"}
            </Button>
            <Button
              className="w-full"
              type="submit"
              disabled={!form?.pin || creating_otp || submitting_form}
              onClick={async () => {
                setSubmittingForm(true);
                await submitForm({
                  pin: form!.pin,
                  email: form!.email,
                  password: form!.password,
                  username: "@" + form!.username,
                  display_name: form!.display_name,
                });
                setSubmittingForm(false);
              }}
            >
              Confirm Pin
            </Button>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
