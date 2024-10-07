"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CirclePlus } from "lucide-react";
import { useState } from "react";

export default function FindLobbies() {
  const [link, setLink] = useState("");

  return (
    <form className="grid gap-2">
      <Label htmlFor="join-lobby" className="text-2xl font-semibold ">
        Find a lobby
      </Label>
      <span className="flex items-center gap-4">
        <Input
          id="join-lobby"
          value={link}
          onChange={(e) => setLink(e.target.value)}
          className="w-2/3"
          placeholder="Enter invite link"
        />
        <Button disabled={!link} className="gap-2">
          <CirclePlus />
          <span>Join</span>
        </Button>
      </span>
    </form>
  );
}
