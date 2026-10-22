'use client';
import AccountRecoverForm from '@/components/page/auth/recover/AccountRecoverForm';
import ResetPasswordForm from '@/components/page/auth/recover/ResetPasswordForm';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

export default function Page() {
  const [index, setIndex] = useState(1);
  const [email, setEmail] = useState('');

  return (
    <section className="grid gap-10">
      {index ? <ResetPasswordForm /> : <AccountRecoverForm setIndex={setIndex} email={email} setEmail={setEmail} />}
      <Button variant="link" className="my-auto">
        Go Back
      </Button>
    </section>
  );
}
