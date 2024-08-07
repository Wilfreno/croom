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
import useHTTPRequest from "@/components/hooks/useHTTPRequest";

export default function OtpVerification({
  user,
  setViewOTP,
}: {
  user: User;
  setViewOTP: Dispatch<SetStateAction<boolean>>;
}) {
  const resend_initial = { time: 30, open: true, interval_id: undefined };

  const [submitting, setSubmitting] = useState(false);
  const [value, setValue] = useState("");
  const [resend, setResend] = useState<{
    time: number;
    open: boolean;
    interval_id?: NodeJS.Timeout;
  }>(resend_initial);

  const { toast } = useToast();
  const http_request = useHTTPRequest();

  async function handleResend() {
    const id = setInterval(() => {
      setResend((prev) => ({ ...prev, time: prev.time - 1 }));
    }, 1000);
    setResend((prev) => ({ ...prev, open: false, interval_id: id }));

    setResend((prev) => ({ ...prev, interval_id: id }));
    try {
      await http_request.POST("/v1/otp", { email: user.email });
    } catch (error) {
      throw error;
    }
  }

  if (resend.time < 1) {
    clearInterval(resend.interval_id);
    setResend(resend_initial);
  }

  return (
    <form
      className="grow flex flex-col justify-evenly space-y-5"
      onSubmit={async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
          await http_request.POST("/v1/otp/authenticate", {
            otp: value,
            email: user.email,
          });

          await http_request.POST("/v1/user", {
            email: user.email,
            display_name: user.display_name,
            user_name: user.user_name,
            password: user.password,
            birth_date: user.birth_date,
            profile_pic: {
              photo_url: "",
            },
          });

          const sign_in = await signIn("credentials", {
            email: user.email,
            password: user.password,
            redirect: true,
            callbackUrl: "/" + user.user_name,
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
          setSubmitting(false);
          throw error;
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
