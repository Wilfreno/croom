'use client';
import { useAuth } from '@/components/providers/AuthProvider';
import Loading from '@/components/svg/Loading';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { OTPType } from '@repo/enums';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function Page() {
  const [email, setEmail] = useState('');

  const {
    signup: { createOTPMutation },
  } = useAuth();

  const router = useRouter();

  return (
    <section className="grid gap-10">
      <form
        data-testid="recover-page-form"
        className="grid gap-4"
        onSubmit={async (event) => {
          event.preventDefault();
          createOTPMutation.mutate({ email, type: OTPType.RECOVER });
        }}
      >
        <Label htmlFor="recover-search-your-email">Search your email</Label>
        <div className="flex items-start gap-2">
          <div className="grid gap-1">
            <div className="relative">
              <Input
                id="recover-search-your-email"
                placeholder="Search your email"
                value={email}
                onChange={(e) => setEmail(e.currentTarget.value)}
                className={cn(
                  'w-96',
                //   (EmailStatus.status === 'NOT_FOUND' || userCheck.status === 'INVALID') &&
                    'border-destructive focus-visible:ring-destructive',
                )}
              />
              {/* {userCheck.checking && (
                <Loading
                  data-testid="recover-search-email-loading"
                  className="absolute aspect-square h-5 w-auto top-1/2 right-2 -translate-y-1/2"
                />
              )} */}
            </div>
            {/* {userCheck.status === 'INVALID' && (
              <span data-testid="recover-email-invalid" className="text-xs text-destructive">
                Invalid email
              </span>
            )}
            {userCheck.status === 'NOT_FOUND' && (
              <span data-testid="recover-email-not-found" className="text-xs text-destructive">
                Cannot find email
              </span>
            )} */}
          </div>
          <Button disabled={!email
        //    ||
        //      userCheck.checking
             } className="justify-self-center">
            Search
          </Button>
        </div>
      </form>
      <Button variant="link" className="my-auto">
        Go Back
      </Button>
    </section>
  );
}
