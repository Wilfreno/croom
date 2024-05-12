"use client";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User } from "@/lib/types/user-type";
import { cn } from "@/lib/utils";
import { EyeClosedIcon, EyeOpenIcon } from "@radix-ui/react-icons";
import { useEffect, useState } from "react";
import OtpVerification from "./OtpVerification";
import { CheckedState } from "@radix-ui/react-checkbox";
import LoadingSvg from "@/components/svg/LoadingSvg";
import { useToast } from "@/components/ui/use-toast";
import { ToastAction } from "@/components/ui/toast";

export default function SignupForm() {
  const development_server = process.env.NEXT_PUBLIC_DEVELOPMENT_SERVER;
  if (!development_server)
    throw new Error(
      "NEXT_PUBLIC_DEVELOPMENT_SERVER is missing from your .env.local file"
    );

  const { toast } = useToast();
  const [user, setUser] = useState<User>({
    first_name: "",
    middle_name: "",
    last_name: "",
    email: "",
    password: "",
  });
  const [agree, setAggree] = useState<CheckedState>(false);
  const [view_otp, setViewOTP] = useState(false);
  const [creating_otp, setCreatingOtp] = useState(false);
  const [password, setPassword] = useState({ base: "", verify: "" });
  const [view_passwrord, setViewPassword] = useState([false, false]);

  useEffect(() => {
    if (password.base && password.verify && password.base === password.verify)
      setUser((prev) => ({ ...prev, password: password.base }));
  }, [password]);

  return (
    <>
      <form
        className={cn("my-auto flex flex-col", view_otp && "hidden")}
        onSubmit={async (e) => {
          e.preventDefault();
          setCreatingOtp(true);
          try {
            const response = await fetch(development_server + "/create/otp");
            setCreatingOtp(false);
            if (!response.ok) {
              const otp_response = await response.json();
              toast({
                title: otp_response.message,
                action: <ToastAction altText="OK">OK</ToastAction>,
              });
              return;
            }
            setViewOTP(true);
          } catch (error) {
            setViewOTP(true);
            toast({
              title: "Oops! Something went wrong",
              action: <ToastAction altText="OK">OK</ToastAction>,
            });
            setCreatingOtp(false);
          }
        }}
      >
        <div className="space-y-5">
          <Input
            type="text"
            required
            placeholder="First name"
            className=" text-base py-5"
            onChange={(e) =>
              setUser((prev) => ({ ...prev, first_name: e.target.value }))
            }
          />
          <Input
            type="text"
            placeholder="Middle name (optional)"
            className=" text-base py-5"
            onChange={(e) =>
              setUser((prev) => ({ ...prev, middle_name: e.target.value }))
            }
          />
          <Input
            type="text"
            required
            placeholder="Last name"
            className=" text-base py-5"
            onChange={(e) =>
              setUser((prev) => ({ ...prev, last_name: e.target.value }))
            }
          />
          <Input
            required
            type="email"
            placeholder="Email"
            className=" text-base py-5"
            onChange={(e) =>
              setUser((prev) => ({ ...prev, email: e.target.value }))
            }
          />
          <div className="relative">
            <Input
              required
              type={view_passwrord[0] ? "text" : "password"}
              placeholder="Password"
              className={cn(
                "text-base py-5",
                password.base &&
                  password.base.length < 8 &&
                  "border-red-600 focus-visible:ring-red-600"
              )}
              onChange={(e) =>
                setPassword((prev) => ({ ...prev, base: e.target.value }))
              }
            />
            <Button
              type="button"
              variant="ghost"
              tabIndex={-1}
              size="sm"
              className="aspect-square p-1 absolute right-5 top-1/2 -translate-y-1/2 "
              onClick={() => setViewPassword((prev) => [!prev[0], prev[1]])}
            >
              {view_passwrord[0] ? (
                <EyeOpenIcon className="w-full h-full" />
              ) : (
                <EyeClosedIcon className="w-full h-full" />
              )}{" "}
            </Button>
            {password.base && password.base.length < 8 && (
              <p className="absolute top-full left-1 text-red-600 text-sm">
                pasword must be atleast 8 characters long
              </p>
            )}
          </div>
          <div className="relative">
            <Input
              required
              type={view_passwrord[1] ? "text" : "password"}
              placeholder="Password (confirm)"
              className={cn(
                " text-base py-5",
                password.base &&
                  password.verify &&
                  password.base !== password.verify &&
                  "border-red-600 focus-within:ring-red-600"
              )}
              onChange={(e) =>
                setPassword((prev) => ({ ...prev, verify: e.target.value }))
              }
            />
            <Button
              type="button"
              variant="ghost"
              tabIndex={-1}
              size="sm"
              className={cn(
                "aspect-square p-1 absolute right-5 top-1/2 -translate-y-1/2"
              )}
              onClick={() => setViewPassword((prev) => [prev[0], !prev[1]])}
            >
              {view_passwrord[1] ? (
                <EyeOpenIcon className="w-full h-full" />
              ) : (
                <EyeClosedIcon className="w-full h-full" />
              )}
            </Button>
            {password.base &&
              password.verify &&
              password.base !== password.verify && (
                <p className="absolute top-full left-1 text-red-600 text-sm">
                  password does not match
                </p>
              )}
          </div>
        </div>
        <div className="my-12 space-y-5">
          <div className="flex items-center justify-center space-x-3 ">
            <Checkbox
              id="terms"
              checked={agree}
              onCheckedChange={(e) => setAggree(e)}
            />
            <Label htmlFor="terms">Accept terms and condition</Label>
          </div>
          <Button
            disabled={
              !user.email ||
              !user.first_name ||
              !user.last_name ||
              !user.password ||
              !agree
            }
            className="w-full text-base"
          >
            {creating_otp ? <LoadingSvg className="h-8" /> : "Signup"}
          </Button>
        </div>
      </form>
      {view_otp && <OtpVerification user={user} setViewOTP={setViewOTP} />}
    </>
  );
}
