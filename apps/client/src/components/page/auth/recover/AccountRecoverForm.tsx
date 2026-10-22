import { useAuth } from '@/components/providers/AuthProvider';
import Loading from '@/components/svg/Loading';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { OTPType } from '@repo/enums';
import { Dispatch, SetStateAction } from 'react';

export default function AccountRecoverForm({
  setIndex,
  email,
  setEmail,
}: {
  setIndex: Dispatch<SetStateAction<number>>;
  email: string;
  setEmail: Dispatch<SetStateAction<string>>;
}) {
  const {
    signup: { createOTPMutation },
  } = useAuth();

  return (
    <form
      data-testid="recover-page-form"
      className="grid gap-4"
      onSubmit={async (event) => {
        event.preventDefault();
        await createOTPMutation.mutateAsync({ email, type: OTPType.RECOVER });
        setIndex(1);
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
              className={cn('w-96', createOTPMutation.isError && 'border-destructive focus-visible:ring-destructive')}
            />
          </div>
        </div>
        <Button disabled={!email || createOTPMutation.isPending} className="justify-self-center">
          {createOTPMutation.isPending ? <Loading /> : 'Search'}
        </Button>
      </div>
    </form>
  );
}
