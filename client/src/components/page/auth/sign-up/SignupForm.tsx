"use client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { Label } from "@/components/ui/label";
import { POSTRequest } from "@/lib/server/requests";
import { ServerResponse, User } from "@/lib/types/server";
import { REGEXP_ONLY_DIGITS_AND_CHARS } from "input-otp";
import { AtSign, ChevronLeft, Eye, EyeOff, Snail } from "lucide-react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import React, { useState } from "react";
import { toast } from "sonner";
import SomethingWentWrong from "../../error/SomethingWentWrong";
import Link from "next/link";

export default function SignUpForm() {
  const [form, setForm] = useState({
    email: "",
    username: "",
    display_name: "",
    password: "",
    confirm_password: "",
    pin: "",
  });
  const [status, setStatus] = useState<ServerResponse["status"]>();
  const [see_password, setSeePassword] = useState([false, false]);
  const [creating_otp, setCreatingOtp] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const resend_initial = { time: 30, open: true, interval_id: undefined };
  const [resend, setResend] = useState<{
    time: number;
    open: boolean;
    interval_id?: NodeJS.Timeout;
  }>(resend_initial);
  const from = useSearchParams().get("from");
  const router = useRouter();

  let search_params = "";
  if (from) search_params += "?from=" + from;

  async function handleResend() {
    const id = setInterval(() => {
      setResend((prev) => ({ ...prev, time: prev.time - 1 }));
    }, 1000);
    setResend((prev) => ({ ...prev, open: false, interval_id: id }));
    await createOTP();
    setResend((prev) => ({ ...prev, interval_id: id }));
  }

  async function createOTP() {
    try {
      setCreatingOtp(true);
      const { status } = await POSTRequest("/v1/otp", {
        email: form.email,
      });

      setStatus(status);
      setCreatingOtp(false);
    } catch (error) {
      setCreatingOtp(false);
      throw error;
    }
  }

  async function submitForm() {
    setSubmitting(true);
    try {
      const { status: otp_status, message: otp_message } = await POSTRequest(
        "/v1/otp/authenticate",
        {
          pin: form.pin,
          email: form.email,
        }
      );

      setStatus(otp_status);
      if (otp_status !== "OK") {
        setSubmitting(false);
        toast(otp_message);
        return;
      }

      const { status: new_user_status, message: new_user_message } =
        await POSTRequest<User>("/v1/user", {
          email: form.email,
          username: "@" + form.username,
          display_name: form.display_name,
          password: form.password,
          provider: "CREDENTIALS",
        });

      setStatus(new_user_status);

      if (new_user_status !== "CREATED") {
        setSubmitting(false);
        toast(new_user_message);
        return;
      }

      const sign_in = await signIn("credentials", {
        username: "@" + form.username,
        password: form.password,
        redirect: false,
      });

      if (sign_in?.error) {
        toast(sign_in.error);
        return;
      }

      router.push(from ? from : "/");
    } catch (error) {
      setSubmitting(false);
      throw error;
    }
  }
  if (resend.time < 1) {
    clearInterval(resend.interval_id);
    setResend(resend_initial);
  }

  if (status === "INTERNAL_SERVER_ERROR") return <SomethingWentWrong />;
  return (
    <>
      <form className="grid gap-4" autoComplete="off">
        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            type="email"
            id="email"
            placeholder="Email"
            value={form.email}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, email: e.target.value }))
            }
          />
        </div>
        <div>
          <span>
            <Label htmlFor="username">Username</Label>
            <div className="relative">
              <Input
                className="pl-8"
                id="username"
                placeholder="Username"
                value={form.username}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, username: e.target.value }))
                }
              />
              <AtSign className="h-4 w-auto absolute left-3 top-1/2 -translate-y-1/2" />
            </div>
          </span>
          <p className="text-xs text-muted-foreground">
            This is how others see you
          </p>
        </div>
        <div>
          <span>
            <Label htmlFor="display-name">Display Name</Label>
            <Input
              id="display-name"
              placeholder="Display Name"
              value={form.display_name}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, display_name: e.target.value }))
              }
            />
          </span>
          <p className="text-xs text-muted-foreground">
            This is how other find you
          </p>
        </div>
        <div>
          <span>
            <Label htmlFor="password">Password</Label>
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
            </div>
            {form.password && form.password.length < 8 && (
              <p className="text-xs text-muted-foreground text-red-500">
                Password must be at least 8 characters long
              </p>
            )}
          </span>
        </div>
        <div>
          <span>
            <Label htmlFor="confirm-password">Confirm Password</Label>
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
          </span>
          {form.confirm_password && form.password !== form.confirm_password && (
            <p className="text-xs text-muted-foreground text-red-500">
              Password is not the same
            </p>
          )}
        </div>
        <Dialog
          onOpenChange={(e) => {
            if (!e) return;
            createOTP();
          }}
        >
          <DialogTrigger asChild>
            <Button
              type="button"
              disabled={
                !form.email ||
                !form.username ||
                !form.display_name ||
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
              <Snail className="h-24 w-auto stroke-1 stroke-muted-foreground" />
              <p className="font-bold text-xl text-primary">Sending OTP</p>
            </DialogContent>
          ) : submitting ? (
            <DialogContent className="grid place-items-center w-[32rem]">
              <Snail className="h-24 w-auto stroke-1 stroke-muted-foreground" />
              <p className="font-bold text-muted-foreground">
                Creating new User
              </p>
            </DialogContent>
          ) : (
            <DialogContent className="w-[32rem]">
              <div className="grid">
                <DialogClose asChild>
                  <Button
                    variant="link"
                    className="w-fit justify-start p-0 mb-5"
                  >
                    <ChevronLeft className="h-5" /> back
                  </Button>
                </DialogClose>
                <p className="">An OTP was sent to your email:</p>
                <p className="italic font-medium">
                  {form.email ? form.email : "user@example.com"}
                </p>
                <p className="my-5"> Please check your inbox.</p>
              </div>
              <InputOTP
                maxLength={6}
                pattern={REGEXP_ONLY_DIGITS_AND_CHARS}
                value={form.pin}
                onChange={(value) =>
                  setForm((prev) => ({ ...prev, pin: value.toUpperCase() }))
                }
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
                disabled={!form.pin || submitting}
                onClick={submitForm}
              >
                Confirm Pin
              </Button>
            </DialogContent>
          )}
        </Dialog>
      </form>
      <span className="text-sm text-center">
        Already have an account?
        <Link href={"/login" + search_params}>
          <Button variant="link" className="text-primary">
            Login
          </Button>
        </Link>
      </span>
    </>
  );
}
