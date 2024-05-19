import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MagnifyingGlassIcon } from "@heroicons/react/24/solid";

export default function NoteSearch() {
  return (
    <section className="grow flex flex-col space-y-5">
      <p className="p-5 text-xl font-bold">Recent Notes</p>
      <div className="relative mx-10">
        <Input id="search_note" placeholder="Search note" />
        <MagnifyingGlassIcon className="h-5 absolute top-1/2 right-3 -translate-y-1/2 text-primary" />
      </div>
      <ScrollArea className="grow p-5">
        <div className="grid grid-cols-4 gap-5"></div>
      </ScrollArea>
    </section>
  );
}
