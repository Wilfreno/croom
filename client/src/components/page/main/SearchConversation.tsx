import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MagnifyingGlassIcon } from "@heroicons/react/24/solid";

export default function SearchConversation() {
  return (
    <div className="relative my-5 mx-2">
      <Input id="search" placeholder="find conversation" autoComplete="off" />
      <Label
        htmlFor="search"
        className="absolute top-1/2 right-5 -translate-y-1/2"
      >
        <MagnifyingGlassIcon className="h-5" />
      </Label>
    </div>
  );
}
