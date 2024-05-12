import { Button } from "@/components/ui/button";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { ToastAction } from "@/components/ui/toast";
import { useToast } from "@/components/ui/use-toast";
import { User } from "@/lib/types/user-type";
import { ChevronLeftIcon } from "@heroicons/react/24/solid";
import { REGEXP_ONLY_DIGITS_AND_CHARS } from "input-otp";
import { Dispatch, SetStateAction, useState } from "react";
import { signIn } from "next-auth/react";
import LoadingSvg from "@/components/svg/LoadingSvg";

export default function OtpVerification({
  user,
  setViewOTP,
}: {
  user: User;
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
  return (
    <form
      className="grow flex flex-col justify-evenly "
      onSubmit={async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
          const response = await fetch(
            development_server + "/authenticate/otp",
            {
              method: "POST",
              headers: {
                "Content-type": "application/json",
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
          const sign_in = await signIn("credentials", {
            email: user.email,
            password: user.password,
            redirect: true,
            callbackUrl: "/",
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
        <p className="my-5"> Please check your inbox</p>
      </div>
      <InputOTP
        maxLength={6}
        pattern={REGEXP_ONLY_DIGITS_AND_CHARS}
        value={value}
        onChange={(value) => setValue(value)}
      >
        <InputOTPGroup className="w-full flex justify-between">
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
      <Button className="w-full">
        {submitting ? <LoadingSvg className="h-8" /> : "Verify"}
      </Button>
    </form>
  );
}
