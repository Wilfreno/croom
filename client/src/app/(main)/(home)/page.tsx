import { Snail } from "lucide-react";
import Link from "next/link";

export default function page() {
  return (
    <section className="inset-y-0 grow grid place-items-center font-medium">
      <div className="flex flex-col items-center text-muted-foreground gap-2">
        <Snail className="h-32 w-auto stroke-1 " />
        <p className=" flex items-center gap-2">
          <span className="font-semibold">Select</span> or{" "}
          <Link href="/compose" className="font-semibold text-primary hover:underline">
            Compose
          </Link>{" "}
          a conversation
        </p>
      </div>
    </section>
  );
}
