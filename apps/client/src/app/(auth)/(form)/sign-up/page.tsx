import SignUpForm from '@/components/page/auth/signup/SignupForm';

export default async function page() {
  return (
    <section className="h-full grow flex flex-col justify-center py-24 px-[10vw]">
      <div className="text-center">
        <h1 className="text-xl md:text-6xl md:w-[30vw] font-semibold bg-gradient-to-r from-[#7f00ff] to-[#e100ff]  bg-clip-text text-transparent">
          Welcome!
        </h1>
        <h2 className="text-sm md:text-base font-medium text-muted-foreground text-center">
          Sign Up for a great experience
        </h2>
      </div>

      <SignUpForm />
    </section>
  );
}
