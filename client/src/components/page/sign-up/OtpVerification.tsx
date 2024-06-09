import { Button } from "@/components/ui/button";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { ToastAction } from "@/components/ui/toast";
import { useToast } from "@/components/ui/use-toast";
import { User } from "@/lib/types/client-types";
import { ChevronLeftIcon } from "@heroicons/react/24/solid";
import { REGEXP_ONLY_DIGITS_AND_CHARS } from "input-otp";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { signIn } from "next-auth/react";
import LoadingSvg from "@/components/svg/LoadingSvg";

export default function OtpVerification({
  user,
  view_otp,
  setViewOTP,
}: {
  user: User;
  view_otp: boolean;
  setViewOTP: Dispatch<SetStateAction<boolean>>;
}) {
  const development_server = process.env.NEXT_PUBLIC_DEVELOPMENT_SERVER;
  if (!development_server)
    throw new Error(
      "NEXT_PUBLIC_DEVELOPMENT_SERVER is missing from your .env.local file"
    );

  const { toast } = useToast();
  const [value, setValue] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const resend_inital = { time: 30, open: true, interval_id: undefined };
  const [resend, setResend] = useState<{
    time: number;
    open: boolean;
    interval_id?: NodeJS.Timeout;
  }>(resend_inital);

  async function handleResend() {
    const id = setInterval(() => {
      setResend((prev) => ({ ...prev, time: prev.time - 1 }));
    }, 1000);
    setResend((prev) => ({ ...prev, open: false, interval_id: id }));

    setResend((prev) => ({ ...prev, interval_id: id }));
    try {
      const response = await fetch(development_server + "/create/v1/otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: user.email }),
      });
      if (!response.ok) {
        const otp_response = await response.json();
        toast({
          title: otp_response.message,
          action: <ToastAction altText="OK">OK</ToastAction>,
        });
        return;
      }
    } catch (error) {
      toast({
        title: "Oops! Something went wrong",
        action: <ToastAction altText="OK">OK</ToastAction>,
      });
    }
  }

  if (resend.time < 1) {
    clearInterval(resend.interval_id);
    setResend(resend_inital);
  }
  console.log(resend);
  return (
    <form
      className="grow flex flex-col justify-evenly space-y-5"
      onSubmit={async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
          const response = await fetch(
            development_server + "/authenticate/otp",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ otp: value, email: user.email }),
            }
          );
          const otp_reponse = await response.json();

          if (otp_reponse.status !== "OK") {
            toast({
              title: otp_reponse.message,
              action: <ToastAction altText="OK">OK</ToastAction>,
            });
            setSubmitting(false);
            return;
          }

          const create_user_response = await fetch(
            development_server + "/create/v1/user",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                email: user.email,
                display_name: user.display_name,
                user_name: user.user_name,
                password: user.password,
                birth_date: user.birth_date,
                profile_pic: {
                  photo_url: "",
                },
              }),
            }
          );

          const create_user = await create_user_response.json();
          if (create_user.status !== "OK")
            toast({
              title: "Oops! Something went wrong",
              description: create_user.message,
              action: <ToastAction altText="OK">OK</ToastAction>,
            });

          const sign_in = await signIn("credentials", {
            email: user.email,
            password: user.password,
            redirect: true,
            callbackUrl: "/chat",
          });

          if (sign_in?.error) {
            toast({
              title: "Oops! Something went wrong",
              description: sign_in.error,
              action: <ToastAction altText="OK">OK</ToastAction>,
            });
          }
          setSubmitting(false);
        } catch (error) {
          toast({
            title: "Oops! Something went wrong",
            action: <ToastAction altText="OK">OK</ToastAction>,
          });
          setSubmitting(false);
        }
      }}
    >
      <div className="grid">
        <Button
          variant="link"
          className="justify-self-end"
          type="button"
          onClick={() => setViewOTP(false)}
        >
          <ChevronLeftIcon className="h-5" /> back
        </Button>
        <p className="">An OTP was sent to your email:</p>
        <p className="italic">
          {user.email ? user.email : "user@example.com"}
        </p>{" "}
        <p className="my-5"> Please check your inbox.</p>
      </div>
      <InputOTP
        maxLength={6}
        pattern={REGEXP_ONLY_DIGITS_AND_CHARS}
        value={value}
        onChange={(value) => setValue(value.toUpperCase())}
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
      <Button className="w-full" type="submit" disabled={!value}>
        {submitting ? <LoadingSvg className="h-8" /> : "Verify"}
      </Button>
    </form>
  );
}
