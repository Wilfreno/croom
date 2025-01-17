"use client";
import { Button } from "@/components/ui/button";
<<<<<<< HEAD
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
=======
import { Dialog, DialogClose, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Label } from "@/components/ui/label";
import { POSTRequest } from "@/lib/server/requests";
import { REGEXP_ONLY_DIGITS_AND_CHARS } from "input-otp";
import { AtSign, ChevronLeft, Eye, EyeOff, Snail } from "lucide-react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import React, { useState } from "react";
import { toast } from "sonner";
import Link from "next/link";
import { User } from "@/lib/types/server-data-types";
import { useMutation } from "@tanstack/react-query";
>>>>>>> 48594df86b677d2b1222ce8220c48d5ef0822e60

export default function SignUpForm() {
  const [form, setForm] = useState({
    email: "",
    username: "",
    password: "",
<<<<<<< HEAD
    display_name: "",
=======
>>>>>>> 48594df86b677d2b1222ce8220c48d5ef0822e60
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
<<<<<<< HEAD
  const [display_name_focused, setDisplayNameFocused] = useState(false);
  const [creating_otp, setCreatingOTP] = useState(false);
  const [submitting_form, setSubmittingForm] = useState(false);

  const from = useSearchParams().get("from");
  const {
    signup: { createOTP, submitForm },
  } = useAuth();
=======

  const from = useSearchParams().get("from");
  const router = useRouter();
>>>>>>> 48594df86b677d2b1222ce8220c48d5ef0822e60

  let search_params = "";
  if (from) search_params += "?from=" + from;

<<<<<<< HEAD
=======
  const create_otp = useMutation({
    mutationFn: async () => {
      const { status, message } = await POSTRequest("/v1/otp", {
        email: form.email,
      });

      if (status !== "CREATED") {
        toast.error(message);
        throw new Error(message);
      }
    },
  });

>>>>>>> 48594df86b677d2b1222ce8220c48d5ef0822e60
  async function handleResend() {
    const id = setInterval(() => {
      setResend((prev) => ({ ...prev, time: prev.time - 1 }));
    }, 1000);
    setResend((prev) => ({ ...prev, open: false, interval_id: id }));
<<<<<<< HEAD
    await createOTP(form.email);
    setResend((prev) => ({ ...prev, interval_id: id }));
  }

=======
    create_otp.mutate();
    setResend((prev) => ({ ...prev, interval_id: id }));
  }

  const verify_otp = useMutation({
    mutationFn: async () => {
      try {
        const { status, message } = await POSTRequest("/v1/otp/authenticate", {
          pin: form.pin,
          email: form.email,
        });

        if (status !== "OK") throw new Error(message);
      } catch (error) {
        toast((error as Error).message);
        throw error;
      }
    },
    onSuccess: () => submit_form.mutate(),
  });

  const submit_form = useMutation({
    mutationFn: async () => {
      try {
        const { status: new_user_status, message: new_user_message } = await POSTRequest<User>("/v1/user", {
          email: form.email,
          username: "@" + form.username,
          display_name: form.email.slice(0, form.email.indexOf("@")),
          password: form.password,
          provider: "CREDENTIALS",
        });

        if (new_user_status !== "CREATED") throw new Error(new_user_message);
      } catch (error) {
        toast.error((error as Error).message);
        throw error;
      }
    },
    onSuccess: () => sign_in.mutate(),
  });

  const sign_in = useMutation({
    mutationFn: async () => {
      const sign_in = await signIn("credentials", {
        username: "@" + form.username,
        password: form.password,
        redirect: false,
      });

      if (sign_in?.error) {
        toast.error(sign_in.error);
        throw new Error(sign_in.error);
      }
      router.push(from ? from : "/");
    },
  });
>>>>>>> 48594df86b677d2b1222ce8220c48d5ef0822e60
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
<<<<<<< HEAD
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, username: e.target.value }))
                  }
=======
                  onChange={(e) => setForm((prev) => ({ ...prev, username: e.target.value }))}
>>>>>>> 48594df86b677d2b1222ce8220c48d5ef0822e60
                  onFocus={() => setUsernameFocused(true)}
                  onBlur={() => !form.username && setUsernameFocused(false)}
                />
                <AtSign className="h-4 w-auto absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
<<<<<<< HEAD
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
=======
              {username_focused && <p className="text-xs text-primary">This is how others see you</p>}
>>>>>>> 48594df86b677d2b1222ce8220c48d5ef0822e60
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
<<<<<<< HEAD
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, password: e.target.value }))
                  }
=======
                  onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
>>>>>>> 48594df86b677d2b1222ce8220c48d5ef0822e60
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-full w-auto p-2  absolute right-2 top-1/2 -translate-y-1/2"
                  onClick={() => setSeePassword((prev) => [!prev[0], prev[1]])}
                >
<<<<<<< HEAD
                  {see_password[0] ? (
                    <Eye className="h-full w-auto" />
                  ) : (
                    <EyeOff className="h-full w-auto" />
                  )}
=======
                  {see_password[0] ? <Eye className="h-full w-auto" /> : <EyeOff className="h-full w-auto" />}
>>>>>>> 48594df86b677d2b1222ce8220c48d5ef0822e60
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
<<<<<<< HEAD
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
=======
                  {see_password[1] ? <Eye className="h-full w-auto" /> : <EyeOff className="h-full w-auto" />}
                </Button>
              </div>
              {form.confirm_password && form.password !== form.confirm_password && (
                <p className="text-xs text-muted-foreground text-red-500">Password is not the same</p>
>>>>>>> 48594df86b677d2b1222ce8220c48d5ef0822e60
              )}
            </div>
          </div>
        </section>

        <Dialog
<<<<<<< HEAD
          onOpenChange={async (e) => {
            if (!e) return;
            setCreatingOTP(true);
            await createOTP(form.email);
            setCreatingOTP(false);
=======
          onOpenChange={(e) => {
            if (!e) return;
            create_otp.mutate();
>>>>>>> 48594df86b677d2b1222ce8220c48d5ef0822e60
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
<<<<<<< HEAD
          {creating_otp ? (
=======
          {create_otp.isPending ? (
>>>>>>> 48594df86b677d2b1222ce8220c48d5ef0822e60
            <DialogContent className="grid place-items-center w-[32rem]">
              <DialogHeader>
                <DialogTitle></DialogTitle>
              </DialogHeader>
              <Snail className="h-24 w-auto stroke-1 stroke-muted-foreground" />
              <p className="font-bold text-xl text-primary">Sending OTP</p>
            </DialogContent>
<<<<<<< HEAD
          ) : submitting_form ? (
=======
          ) : verify_otp.isPending || submit_form.isPending || sign_in.isPending ? (
>>>>>>> 48594df86b677d2b1222ce8220c48d5ef0822e60
            <DialogContent className="grid place-items-center w-[32rem]">
              <DialogHeader>
                <DialogTitle></DialogTitle>
              </DialogHeader>
              <Snail className="h-24 w-auto stroke-1 stroke-muted-foreground" />

              <p className="font-bold text-muted-foreground animate-pulse">
<<<<<<< HEAD
                Creating new user
=======
                {verify_otp.isPending ? "Verifying otp" : "Creating new User"}
>>>>>>> 48594df86b677d2b1222ce8220c48d5ef0822e60
              </p>
            </DialogContent>
          ) : (
            <DialogContent className="w-[32rem]">
              <DialogHeader>
                <DialogTitle></DialogTitle>
              </DialogHeader>
              <div className="grid">
<<<<<<< HEAD
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
=======
                <DialogClose asChild>
                  <Button variant="link" className="w-fit justify-start p-0 mb-5">
                    <ChevronLeft className="h-5" /> back
                  </Button>
                </DialogClose>
                <p className="">An OTP was sent to your email:</p>
                <p className="italic font-medium">{form.email ? form.email : "user@example.com"}</p>
                <p className="my-5"> Please check your inbox.</p>
>>>>>>> 48594df86b677d2b1222ce8220c48d5ef0822e60
              </div>
              <InputOTP
                maxLength={6}
                pattern={REGEXP_ONLY_DIGITS_AND_CHARS}
                value={form.pin}
<<<<<<< HEAD
                onChange={(value) =>
                  setForm((prev) => ({ ...prev, pin: value.toUpperCase() }))
                }
=======
                onChange={(value) => setForm((prev) => ({ ...prev, pin: value.toUpperCase() }))}
>>>>>>> 48594df86b677d2b1222ce8220c48d5ef0822e60
                autoFocus
              >
                <InputOTPGroup className="w-full flex justify-between space-x-5">
                  <InputOTPSlot
                    index={0}
                    className="aspect-square w-11 h-auto text-base border rounded first:rounded-l"
                  />
<<<<<<< HEAD
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
=======
                  <InputOTPSlot index={1} className="aspect-square w-11 h-auto text-base border rounded" />
                  <InputOTPSlot index={2} className="aspect-square w-11 h-auto text-base border rounded" />
                  <InputOTPSlot index={3} className="aspect-square w-11 h-auto text-base border rounded" />
                  <InputOTPSlot index={4} className="aspect-square w-11 h-auto text-base border rounded" />
>>>>>>> 48594df86b677d2b1222ce8220c48d5ef0822e60
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
<<<<<<< HEAD
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
=======
                disabled={!form.pin || verify_otp.isPending || submit_form.isPending}
                onClick={() => verify_otp.mutate()}
>>>>>>> 48594df86b677d2b1222ce8220c48d5ef0822e60
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
