import { ThemeToggler } from "@/components/dark-mode/ThemeToggler";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";

export default function page() {
  return (
    <div className="border rounded p-5  bg-primary-foreground shadow-lg relative">
      <ThemeToggler className="absolute top-1 right-2" />
      <section className="font-bold text-secondary-foreground mb-10">
        <p className="text-xl">Welcome back!</p>
        <p className="text-sm">we're excited to see you again</p>
      </section>
      <section className="flex space-x-10">
        <form className="space-y-5">
          <Input placeholder="Email" className=" text-base py-5" />
          <div className="space-y-1">
            <Input placeholder="Password" className=" text-base py-5" />
            <div>
              <Link
                href="#"
                className="text-primary text-center text-bold my-2 text-sm"
              >
                forgot your password?
              </Link>
            </div>
          </div>
          <Button className="w-full text-base">Login</Button>
          <p className="text-sm">
            Don't have an account?{" "}
            <Link href="/signup" as="/signup" prefetch className="text-primary">
              Signup
            </Link>
          </p>
        </form>
        <div className="w-[15rem] space-y-10 flex flex-col">
          <p className="secondary-foreground mx-auto font-bold">
            Continue with
          </p>
          <div className="flex justify-start space-x-5">
            <Button
              variant="secondary"
              className="aspect-square w-fit h-auto text-base"
            >
              G
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
