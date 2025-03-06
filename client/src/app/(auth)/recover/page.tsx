"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function Page() {
  return (
    <section className="grow flex flex-col gap-20 items-center p-10">
      <header className="text-2xl font-semibold text-primary">Recover your account</header>
      <form
        className="grid gap-4"
        onSubmit={async (event) => {
          event.preventDefault();
        }}
      >
        <Label>Search your email</Label>
        <div className="flex items-center gap-2">
          <Input placeholder="Search your email" className="w-96" />
          <Button className="justify-self-center">Search</Button>
        </div>
      </form>
    </section>
  );
}
