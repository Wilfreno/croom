'use client';
import AccountRecoverForm from '@/components/page/auth/recover/AccountRecoverForm';
import ResetPasswordForm from '@/components/page/auth/recover/ResetPasswordForm';
import { Button } from '@/components/ui/button';
import { AnimatePresence } from 'motion/react';
import { useRouter } from 'next/navigation';
import { Suspense, useState } from 'react';

export default function Page() {
  const [email, setEmail] = useState('');
  const [pageNumber, setPageNumber] = useState(0);

  const [direction, setDirection] = useState<1 | -1>(1);

  const router = useRouter();
  function navigateTo(page: number) {
    setDirection(page > pageNumber ? 1 : -1);
    setPageNumber(page);
  }
  return (
    <Suspense>
      <section className="grid gap-10">
        <AnimatePresence custom={direction} initial={false} mode="popLayout">
          {pageNumber === 0 ? (
            <AccountRecoverForm navigateTo={navigateTo} email={email} setEmail={setEmail} />
          ) : (
            <ResetPasswordForm email={email} />
          )}
        </AnimatePresence>
        <Button
          variant="link"
          className="my-auto"
          onClick={() => {
            if (pageNumber) navigateTo(0);
            else router.push('/');
          }}
        >
          Go Back
        </Button>
      </section>
    </Suspense>
  );
}
