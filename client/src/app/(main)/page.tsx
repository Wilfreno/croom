import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MagnifyingGlassIcon, PlusIcon } from "@heroicons/react/24/solid";

export default function page() {
  return (
    <main className="flex grow">
      <section className="w-1/5 h-full grid grid-rows-[auto_1fr] border-r p-5 space-y-10">
        <div className="relative">
          <Input
            id="search"
            placeholder="find conversation"
            autoComplete="off"
          />
          <Label
            htmlFor="search"
            className="absolute top-1/2 right-2 -translate-y-1/2"
          >
            <MagnifyingGlassIcon className="h-5" />
          </Label>
        </div>
        <div>
          <div>
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold">Direct messages</p>
              <Button variant="ghost" className="p-0 h-fit" type="button">
                <PlusIcon className="h-4" />
              </Button>
            </div>
            <ScrollArea className="h-[40dvh] py-3">
              <div></div>
            </ScrollArea>
          </div>
          <div>
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold">Group chats</p>
              <Button variant="ghost" className="p-0 h-fit">
                <PlusIcon className="h-4" />
              </Button>
            </div>
            <ScrollArea className="h-[40dvh] pt-3">
              <div></div>
            </ScrollArea>
          </div>
        </div>
      </section>
      <section className="grow flex flex-col">
        <p className="p-5 text-xl font-bold">Recent Notes</p>
        <ScrollArea className="grow p-5">
          <div className="grid grid-cols-4 gap-5"></div>
        </ScrollArea>
      </section>
      <section className="w-1/5 border-l py-10 px-5 space-y-10 flex flex-col">
        <p className="font-bold">Active friends</p>
        <ScrollArea className="grow">
          <div></div>
        </ScrollArea>
      </section>
    </main>
  );
}
