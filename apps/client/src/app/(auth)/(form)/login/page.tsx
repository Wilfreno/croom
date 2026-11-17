import LoginForm from '@/components/page/auth/login/LoginForm';
import LoginWGoogle from '@/components/page/auth/login/LoginWGoogle';
import NavigateToSignUpButton from '@/components/page/auth/login/NavigateToSignUpButton';
import { Suspense } from 'react';

export default function Page() {
  return (
    <section className="h-full grow min-w-0 overflow-y-auto flex flex-col px-6 py-8 sm:px-12">
      <div className="w-full max-w-md m-auto flex flex-col gap-10">
        <div className="hidden md:block">
          <h1
            data-testid="login-page-h1"
            className="text-4xl xl:text-5xl text-start font-semibold bg-gradient-to-r from-[#7f00ff] to-[#e100ff]  bg-clip-text text-transparent"
          >
            Connect and Chat with your friends and Communities
          </h1>
          <h2 data-testid="login-page-h2" className="text-muted-foreground font-medium my-4">
            <span className="font-bold">Welcome! </span>
            we&apos;re excited to see you
          </h2>
        </div>
        <div className="grid grid-rows-[1fr_auto] gap-6 md:gap-8">
          <div className="flex flex-col gap-4">
            <LoginForm />
            <LoginWGoogle />
          </div>
          <Suspense>
            <NavigateToSignUpButton />
          </Suspense>
        </div>
      </div>
    </section>
  );
}
