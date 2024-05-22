import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { XMarkIcon } from "@heroicons/react/24/solid";
import { useState } from "react";

export default function AddFriend() {
  const [username, setUsername] = useState("");
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="default" className="text-secondary-foreground">
          Add friend
        </Button>
      </DialogTrigger>
      <DialogContent className="space-y-5">
        <DialogHeader className="relative">
          <DialogClose className="absolute -top-2 -right-2">
            <XMarkIcon className="h-5 " />
          </DialogClose>
          <DialogTitle>Add Friend</DialogTitle>
          <DialogDescription>Add friend with their username</DialogDescription>
        </DialogHeader>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
          }}
          className="flex bg-primary-foreground rounded-lg p-2"
          autoComplete="off"
        >
          <Input
            placeholder="Add friend with their username"
            id="username"
            className="border-none bg-transparent focus-visible:ring-0"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <Button type="submit" disabled={!username}>
            Send Friend request
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
