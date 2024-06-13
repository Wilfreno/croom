import { ThemeToggler } from "@/components/dark-mode/ThemeToggler";
import SignUpForm from "@/components/page/sign-up/SignupForm";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function page() {
  return (
    <section className="flex flex-col space-y-5 border rounded bg-primary-foreground py-5 px-3 shadow-lg relative">
      <ThemeToggler className="absolute top-1 right-2" />
      <h1 className="text-xl font-bold text-center">Signup</h1>
      <SignUpForm />
      <p className="text-center text-sm">
        Already have an account?{" "}
        <Button variant="ghost" className="p-1 h-fit">
          <Link href="/login" as="/login" prefetch className="text-primary p-0">
            Login
          </Link>
        </Button>
      </p>
    </section>
  );
}
