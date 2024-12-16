import SignUpForm from "@/components/page/auth/signup/SignupForm";

export default function page() {
  return (
    <section className="h-full flex flex-col gap-8 px-[10vw]">
      <div className="text-center">
        <h1 className="text-6xl w-[30vw] font-semibold bg-gradient-to-r from-[#7f00ff] to-[#e100ff]  bg-clip-text text-transparent">
          Welcome!
        </h1>
        <h2 className="font-medium text-muted-foreground">Sign Up for a great experience</h2>
      </div>

      <SignUpForm />
    </section>
  );
}
