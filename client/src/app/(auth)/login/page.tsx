import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";

export default function page() {
  return (
    <section className="grow p-10 w-[30rem] flex flex-col ">
      <form className="py-10 space-y-5 my-auto">
        <Input placeholder="Email" className=" text-base py-5" />
        <Input placeholder="Password" className=" text-base py-5" />
        <Button className="w-full text-base">Login</Button>
        <Button variant="ghost" className="mx-auto flex">
          <Link href="#" className="text-primary text-center text-bold">
            forgotten your password?
          </Link>
        </Button>
      </form>
      <div className="w-full space-y-3 mb-auto">
        <Button variant="secondary" className="w-full">
          Continue with GOOGLE
        </Button>
        <p className="text-center">
          Don't have an account?{" "}
          <Button variant="ghost" className="p-1 h-fit">
            <Link
              href="/signup"
              as="/signup"
              prefetch
              className="text-primary p-0"
            >
              Signup
            </Link>
          </Button>
        </p>
      </div>
    </section>
  );
}
