'use client';
import { SignUpFormData } from '@repo/types';
import { AnimatePresence } from 'motion/react';
import { Suspense, useState } from 'react';
import SignUpMainForm from './SignUpMainForm';
import SignupNavigateToLoginPage from './SignupNavigateToLoginPage';
import SignUpOTPForm from './SignUpOTPForm';

export default function SignUpForm() {
  const [signupFormData, setSignUpFormData] = useState<SignUpFormData>({
    email: '',
    password: '',
    confirmPassword: '',
    pin: '',
  });
  const [pageNumber, setPageNumber] = useState(0);
  const [direction, setDirection] = useState<1 | -1>(1);

  function navigateTo(page: number) {
    setDirection(page > pageNumber ? 1 : -1);
    setPageNumber(page);
  }

  return (
    <section className="grid my-auto gap-8">
      <Suspense>
        <AnimatePresence custom={direction} initial={false} mode="popLayout">
          {pageNumber === 0 ? (
            <SignUpMainForm
              key="main"
              formData={signupFormData}
              setFormData={setSignUpFormData}
              navigateTo={navigateTo}
            />
          ) : (
            <SignUpOTPForm
              key="otp"
              formData={signupFormData}
              setFormData={setSignUpFormData}
              navigateTo={navigateTo}
            />
          )}
        </AnimatePresence>
        <SignupNavigateToLoginPage />
      </Suspense>
    </section>
  );
}
