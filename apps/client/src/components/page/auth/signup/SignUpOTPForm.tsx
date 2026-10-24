import { useAuth } from '@/components/providers/AuthProvider';
import Loading from '@/components/svg/Loading';
import { Button } from '@/components/ui/button';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { cn } from '@/lib/utils';
import { SECONDS_IN_MINUTE } from '@repo/constants';
import { OTPType } from '@repo/enums';
import { SignUpFieldProps } from '@repo/types';
import { REGEXP_ONLY_DIGITS_AND_CHARS } from 'input-otp';
import { MoveLeft } from 'lucide-react';
import { motion, usePresenceData } from 'motion/react';
import { forwardRef, useEffect, useState } from 'react';

const SignUpOTPForm = forwardRef<
  HTMLFormElement,
  SignUpFieldProps & {
    navigateTo: (page: number) => void;
  }
>(function SignUpOTPForm({ formData, setFormData, navigateTo }, ref) {
  const [resend, setResend] = useState<{ time: number; open: boolean }>({
    time: SECONDS_IN_MINUTE,
    open: false,
  });

  const direction = usePresenceData();
  const {
    signup: { createOTPMutation, submitSignUpFormMutation},
  } = useAuth();

  async function handleResend() {
    try {
      setResend({ time: SECONDS_IN_MINUTE, open: false });
      await createOTPMutation.mutateAsync({ email: formData.email, type: OTPType.SIGNUP });
    } catch (error) {
      setResend({ time: SECONDS_IN_MINUTE, open: true });
    }
  }

  useEffect(() => {
    if (resend.open) return;

    const id = setInterval(() => {
      setResend((prev) =>
        prev.time <= 1 ? { time: SECONDS_IN_MINUTE, open: true } : { ...prev, time: prev.time - 1 },
      );
    }, 1000);

    return () => clearInterval(id);
  }, [resend.open]);

  return (
    <motion.form
      ref={ref}
      initial={{ opacity: 0, x: direction * 50 }}
      animate={{
        opacity: 1,
        x: 0,
        transition: {
          delay: 0.2,
          type: 'spring',
          visualDuration: 0.3,
          bounce: 0.4,
        },
      }}
      exit={{
        opacity: 0,
        x: direction * -50,
        transition: { duration: 0.2 },
      }}
      data-testid="signup-form"
      className="grid gap-8"
      autoComplete="off"
      onSubmit={async (event) => {
        event.preventDefault();
        submitSignUpFormMutation.mutate(formData);
      }}
    >
      <Button variant="link" className="place-self-start p-0 my-4" type="button" onClick={() => navigateTo(0)}>
        <MoveLeft />
        <span>go back</span>
      </Button>
      <div className="grid ">
        <p className="">An OTP was sent to your email:</p>
        <p className="italic font-medium">{formData.email ? formData.email : 'user@example.com'}</p>
        <div className="my-5">
          <p> Please check your inbox.</p>
          <p className="text-xs font-medium text-muted-foreground">or check your spam section</p>
        </div>
      </div>
      <InputOTP
        maxLength={6}
        pattern={REGEXP_ONLY_DIGITS_AND_CHARS}
        value={formData.pin}
        onChange={(value) => setFormData((prev) => ({ ...prev, pin: value.toLocaleUpperCase() }))}
        autoFocus
      >
        <InputOTPGroup className="w-full flex justify-center gap-8 ">
          {Array.from({ length: 6 }).map((_, index, array) => (
            <InputOTPSlot
              key={index}
              index={index}
              className={cn(
                'aspect-square md:w-14 h-auto text-base border rounded',
                index === 0 && 'first:rounded-l',
                index === array.length - 1 && 'last:rounded-r',
              )}
            />
          ))}
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
        {createOTPMutation.isPending ? 'resending...' : 'resend'}
        {!resend.open && !createOTPMutation.isPending && '(' + resend.time + ')'}
      </Button>
      <Button className="w-full" type="submit" disabled={!formData.pin || submitSignUpFormMutation.isPending}>
        {submitSignUpFormMutation.isPending ? <Loading /> : 'Create'}
      </Button>
    </motion.form>
  );
});

export default SignUpOTPForm;
