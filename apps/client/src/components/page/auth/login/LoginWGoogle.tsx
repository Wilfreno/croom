'use client';

import { useAuth } from '@/components/providers/AuthProvider';
import GoogleSvg from '@/components/svg/GoogleSvg';
import { Button } from '@/components/ui/button';
import { AuthServiceOptions } from '@repo/enums';

export default function LoginWGoogle() {
  const { loginMutation } = useAuth();

  return (
    <Button
      data-testid="login-w-google"
      variant="secondary"
      onClick={async () => {
        await loginMutation.mutateAsync({ authOption: AuthServiceOptions.WITH_GOOGLE });
      }}
      className="gap-2 w-full"
    >
      <span>Login with Google</span>
      <GoogleSvg className="h-6 w-auto" />
    </Button>
  );
}
