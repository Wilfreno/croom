"use client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Label } from "@/components/ui/label";
import { REGEXP_ONLY_DIGITS_AND_CHARS } from "input-otp";
import { AtSign, Eye, EyeOff, Snail } from "lucide-react";
import { useSearchParams } from "next/navigation";
import React, { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/providers/AuthProvider";

export default function SignUpForm() {
  const [form, setForm] = useState({
    email: "",
    username: "",
    password: "",
    display_name: "",
    confirm_password: "",
    pin: "",
  });
  const [see_password, setSeePassword] = useState([false, false]);
  const resend_initial = { time: 30, open: true, interval_id: undefined };
  const [resend, setResend] = useState<{
    time: number;
    open: boolean;
    interval_id?: NodeJS.Timeout;
  }>(resend_initial);
  const [username_focused, setUsernameFocused] = useState(false);
  const [display_name_focused, setDisplayNameFocused] = useState(false);
  const [creating_otp, setCreatingOTP] = useState(false);
  const [submitting_form, setSubmittingForm] = useState(false);

  const from = useSearchParams().get("from");
  const {
    signup: { createOTP, submitForm },
  } = useAuth();

  let search_params = "";
  if (from) search_params += "?from=" + from;

  async function handleResend() {
    const id = setInterval(() => {
      setResend((prev) => ({ ...prev, time: prev.time - 1 }));
    }, 1000);
    setResend((prev) => ({ ...prev, open: false, interval_id: id }));
    await createOTP(form.email);
    setResend((prev) => ({ ...prev, interval_id: id }));
  }

  if (resend.time < 1) {
    clearInterval(resend.interval_id);
    setResend(resend_initial);
  }

  return (
    <section className="grid gap-4">
      <form className="grid gap-10" autoComplete="off">
        <section className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              type="email"
              id="email"
              placeholder="Email"
              value={form.email}
              onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="username">Username</Label>
            <div className="grid gap-1">
              <div className="relative">
                <Input
                  className="pl-8"
                  id="username"
                  placeholder="Username"
                  value={form.username}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, username: e.target.value }))
                  }
                  onFocus={() => setUsernameFocused(true)}
                  onBlur={() => !form.username && setUsernameFocused(false)}
                />
                <AtSign className="h-4 w-auto absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
              {username_focused && (
                <p className="text-xs text-primary">This is how others find you</p>
              )}
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="username">Display name</Label>
            <div className="grid gap-1">
              <Input
                id="username"
                placeholder="Display name"
                value={form.display_name}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, display_name: e.target.value }))
                }
                onFocus={() => setDisplayNameFocused(true)}
                onBlur={() => !form.display_name && setDisplayNameFocused(false)}
              />
              <AtSign className="h-4 w-auto absolute left-3 top-1/2 -translate-y-1/2" />
              {display_name_focused && (
                <p className="text-xs text-primary">This is how others see you</p>
              )}
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password">Password</Label>
            <div className="grid gap-1">
              <div className="relative">
                <Input
                  type={see_password[0] ? "text" : "password"}
                  id="password"
                  placeholder="Password"
                  value={form.password}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, password: e.target.value }))
                  }
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-full w-auto p-2  absolute right-2 top-1/2 -translate-y-1/2"
                  onClick={() => setSeePassword((prev) => [!prev[0], prev[1]])}
                >
                  {see_password[0] ? (
                    <Eye className="h-full w-auto" />
                  ) : (
                    <EyeOff className="h-full w-auto" />
                  )}
                </Button>
                {form.password && form.password.length < 8 && (
                  <p className="text-xs text-muted-foreground text-red-500">
                    Password must be at least 8 characters long
                  </p>
                )}
              </div>
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="confirm-password">Confirm Password</Label>
            <div className="grid gap-1">
              <div className="relative">
                <Input
                  type={see_password[1] ? "text" : "password"}
                  id="confirm-password"
                  placeholder="Confirm Password"
                  value={form.confirm_password}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      confirm_password: e.target.value,
                    }))
                  }
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-full w-auto p-2 absolute right-2 top-1/2 -translate-y-1/2"
                  onClick={() => setSeePassword((prev) => [prev[0], !prev[1]])}
                >
                  {see_password[1] ? (
                    <Eye className="h-full w-auto" />
                  ) : (
                    <EyeOff className="h-full w-auto" />
                  )}
                </Button>
              </div>
              {form.confirm_password && form.password !== form.confirm_password && (
                <p className="text-xs text-muted-foreground text-red-500">
                  Password is not the same
                </p>
              )}
            </div>
          </div>
        </section>

        <Dialog
          onOpenChange={async (e) => {
            if (!e) return;
            setCreatingOTP(true);
            await createOTP(form.email);
            setCreatingOTP(false);
          }}
        >
          <DialogTrigger asChild>
            <Button
              type="button"
              disabled={
                !form.email ||
                !form.username ||
                !form.password ||
                form.password.length < 8 ||
                !form.confirm_password ||
                form.password !== form.confirm_password
              }
            >
              Submit
            </Button>
          </DialogTrigger>
          {creating_otp ? (
            <DialogContent className="grid place-items-center w-[32rem]">
              <DialogHeader>
                <DialogTitle></DialogTitle>
              </DialogHeader>
              <Snail className="h-24 w-auto stroke-1 stroke-muted-foreground" />
              <p className="font-bold text-xl text-primary">Sending OTP</p>
            </DialogContent>
          ) : submitting_form ? (
            <DialogContent className="grid place-items-center w-[32rem]">
              <DialogHeader>
                <DialogTitle></DialogTitle>
              </DialogHeader>
              <Snail className="h-24 w-auto stroke-1 stroke-muted-foreground" />

              <p className="font-bold text-muted-foreground animate-pulse">
                Creating new user
              </p>
            </DialogContent>
          ) : (
            <DialogContent className="w-[32rem]">
              <DialogHeader>
                <DialogTitle></DialogTitle>
              </DialogHeader>
              <div className="grid">
                <DialogClose asChild className="absolute top-2 right-2">
                  <Button variant="outline">Back</Button>
                </DialogClose>
                <p className="">An OTP was sent to your email:</p>
                <p className="italic font-medium">
                  {form.email ? form.email : "user@example.com"}
                </p>
                <div className="my-5">
                  <p> Please check your inbox.</p>
                  <p className="text-xs font-medium text-muted-foreground">
                    or check your spam section
                  </p>
                </div>
              </div>
              <InputOTP
                maxLength={6}
                pattern={REGEXP_ONLY_DIGITS_AND_CHARS}
                value={form.pin}
                onChange={(value) =>
                  setForm((prev) => ({ ...prev, pin: value.toUpperCase() }))
                }
                autoFocus
              >
                <InputOTPGroup className="w-full flex justify-between space-x-5">
                  <InputOTPSlot
                    index={0}
                    className="aspect-square w-11 h-auto text-base border rounded first:rounded-l"
                  />
                  <InputOTPSlot
                    index={1}
                    className="aspect-square w-11 h-auto text-base border rounded"
                  />
                  <InputOTPSlot
                    index={2}
                    className="aspect-square w-11 h-auto text-base border rounded"
                  />
                  <InputOTPSlot
                    index={3}
                    className="aspect-square w-11 h-auto text-base border rounded"
                  />
                  <InputOTPSlot
                    index={4}
                    className="aspect-square w-11 h-auto text-base border rounded"
                  />
                  <InputOTPSlot
                    index={5}
                    className="aspect-square w-11 h-auto text-base border rounded last:rounded-r"
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
                disabled={!form.pin || creating_otp || submitting_form}
                onClick={() => {
                  setSubmittingForm(true);
                  submitForm({
                    pin: form.pin,
                    email: form.email,
                    password: form.password,
                    username: form.username,
                    display_name: form.display_name,
                  });
                  setSubmittingForm(false);
                }}
              >
                Confirm Pin
              </Button>
            </DialogContent>
          )}
        </Dialog>
      </form>
      <span>
        Already have an account?
        <Link href={"/login" + search_params}>
          <Button variant="link" className="text-primary">
            Login
          </Button>
        </Link>
      </span>
    </section>
  );
}
