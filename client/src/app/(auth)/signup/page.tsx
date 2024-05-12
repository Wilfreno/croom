import SignupForm from "@/components/page/sign-up/SignupForm";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function page() {
  return (
    <section className="grow p-10 w-[30rem] flex flex-col ">
      <SignupForm />
      <p className="text-center my-auto">
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
