import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";

export default function page() {
  return (
    <section className="grow p-10 w-[30rem] flex flex-col ">
      <form className="my-auto flex flex-col">
        <div className="space-y-5">
          <Input placeholder="First name" className=" text-base py-5" />
          <Input
            placeholder="Middle name (optional)"
            className=" text-base py-5"
          />
          <Input placeholder="Last name" className=" text-base py-5" />
          <Input placeholder="Email" className=" text-base py-5" />
          <Input placeholder="Password" className=" text-base py-5" />
          <Input placeholder="Password (confirm)" className=" text-base py-5" />
        </div>
        <div className="my-12 space-y-5">
          <div className="flex items-center justify-center space-x-3 ">
            <Checkbox id="terms" />
            <Label htmlFor="terms">Accept terms and condition</Label>
          </div>
          <Button className="w-full text-base">Signup</Button>
        </div>
      </form>
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
