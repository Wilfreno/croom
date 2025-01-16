<<<<<<< HEAD
"use client";
import { useAuth } from "@/components/providers/SessionProvider";
import { Snail } from "lucide-react";
import Link from "next/link";

export default function Page() {
  const { session } = useAuth();

  console.log(session);
=======
import { Snail } from "lucide-react";

export default function page() {
>>>>>>> 48594df86b677d2b1222ce8220c48d5ef0822e60
  return (
    <section className="inset-y-0 grow grid place-items-center font-medium">
      <div className="flex flex-col items-center text-muted-foreground gap-2">
        <Snail className="h-32 w-auto stroke-1 " />
        <p className=" flex items-center gap-2">
<<<<<<< HEAD
          <span className="font-semibold">Select</span> or{" "}
          <Link href="/compose" className="font-semibold text-primary hover:underline">
            Compose
          </Link>{" "}
          a conversation
=======
          <strong>Select</strong> or <strong>Compose</strong> a conversation
>>>>>>> 48594df86b677d2b1222ce8220c48d5ef0822e60
        </p>
      </div>
    </section>
  );
}
