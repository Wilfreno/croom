import SignUpForm from "@/components/page/auth/sign-up/SignupForm";

export default function page() {
  return (
    <main className="grid w-screen h-dvh place-items-center">
      <section className="grid gap-8">
        <span className="text-center space-y-2">
          <h1 className="text-6xl font-bold text-center text-primary">
            ChatUp
          </h1>
          <h2 className="font-medium text-muted-foreground">
            <strong>Welcome!</strong> Sign Up for a great experience
          </h2>
        </span>

        <SignUpForm />
      </section>
    </main>
  );
}
