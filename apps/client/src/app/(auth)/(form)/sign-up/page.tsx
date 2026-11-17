import SignUpForm from '@/components/page/auth/signup/SignupForm';

export default async function page() {
  return (
    <section className="h-full grow min-w-0 overflow-y-auto flex flex-col px-6 py-8 sm:px-12">
      <div className="w-full max-w-md m-auto flex flex-col gap-8">
        <div className="text-center">
          <h1 className="text-3xl md:text-5xl font-semibold bg-gradient-to-r from-[#7f00ff] to-[#e100ff]  bg-clip-text text-transparent">
            Welcome!
          </h1>
          <h2 className="text-sm md:text-base font-medium text-muted-foreground text-center">
            Sign Up for a great experience
          </h2>
        </div>

        <SignUpForm />
      </div>
    </section>
  );
}
