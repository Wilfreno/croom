import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";

export default function page() {
  return (
    <section className="grow p-10 w-[30rem] flex flex-col ">
      <form className="py-10 space-y-5  my-auto">
        <Input placeholder="Email" className=" text-base py-5" />
        <Input placeholder="Password" className=" text-base py-5" />
        <Button className="w-full text-base">Login</Button>
        <p className="text-primary text-center text-bold my-5">
          <Link href="#">forgotten your password?</Link>
        </p>
      </form>
      <div className="w-full space-y-3 mb-auto">
        <Button variant="secondary" className="w-full">
          Continue with GOOGLE
        </Button>
        <p className="text-center">
          Don't have an account?{" "}
          <Link href="/signup" as="/signup" prefetch className="text-primary">
            Signup
          </Link>
        </p>
      </div>
    </section>
  );
}
