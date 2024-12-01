import { Snail } from "lucide-react";

export default function page() {
  return (
    <section className="inset-y-0 grow grid place-items-center font-medium">
      <div className="flex flex-col items-center text-muted-foreground gap-2">
        <Snail className="h-32 w-auto stroke-1 " />
        <p className=" flex items-center gap-2"> Select or Start a conversation </p>
      </div>
    </section>
  );
}
