import SignUpForm from "@/components/page/auth/signup/SignupForm";
import { Suspense } from "react";

export default function Page() {
  return (
    <section className="h-full grow flex flex-col gap-4 px-[10vw]">
      <div className="text-center">
        <h1 className="text-xl md:text-6xl md:w-[30vw] font-semibold bg-gradient-to-r from-[#7f00ff] to-[#e100ff]  bg-clip-text text-transparent">
          Welcome!
        </h1>
        <h2 className="text-sm md:text-base font-medium text-muted-foreground">Sign Up for a great experience</h2>
      </div>
      <Suspense>
        <SignUpForm />
      </Suspense>
    </section>
  );
}
