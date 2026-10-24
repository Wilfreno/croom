import { useAuth } from '@/components/providers/AuthProvider';
import Loading from '@/components/svg/Loading';
import { Button } from '@/components/ui/button';
import { EmailStatus, OTPType } from '@repo/enums';
import { SignUpFieldProps } from '@repo/types';
import { useQueryClient } from '@tanstack/react-query';
import { motion, usePresenceData } from 'motion/react';
import { forwardRef } from 'react';
import SignupEmailInput from './SignupEmailInput';
import SignupPasswordInput from './SignupPasswordInput';

const SignUpMainForm = forwardRef<
  HTMLFormElement,
  SignUpFieldProps & {
    navigateTo: (page: number) => void;
  }
>(function SignUpMainForm({ formData, setFormData, navigateTo }, ref) {
  const direction = usePresenceData();
  const queryClient = useQueryClient();
  const {
    signup: { createOTPMutation },
  } = useAuth();

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
        await createOTPMutation.mutateAsync({ email: formData.email, type: OTPType.SIGNUP });
        navigateTo(1);
      }}
    >
      <div className="grid gap-4">
        <SignupEmailInput formData={formData} setFormData={setFormData} />
        <SignupPasswordInput formData={formData} setFormData={setFormData} />
      </div>
      <Button
        disabled={
          !formData.email ||
          !formData.password ||
          formData.password !== formData.confirmPassword ||
          createOTPMutation.isPending ||
          queryClient.getQueryData(['signup', 'form', 'email', 'check', formData.email]) === EmailStatus.ALREADY_USED ||
          queryClient.getQueryData(['signup', 'form', 'email', 'check', formData.email]) === EmailStatus.INVALID ||
          queryClient.getQueryState(['signup', 'form', 'email', 'check', formData.email])?.status === 'pending'
        }
      >
        {createOTPMutation.isPending ? <Loading /> : 'Continue'}
      </Button>
    </motion.form>
  );
});

export default SignUpMainForm;
