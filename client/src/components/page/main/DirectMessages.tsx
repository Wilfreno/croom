"use client";
import useServerUrl from "@/components/hooks/useServerUrl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/components/ui/use-toast";
import { Message } from "@/lib/types/client-types";
import { ServerResponse } from "@/lib/types/sever-response";
import {
  MagnifyingGlassIcon,
  PencilSquareIcon,
} from "@heroicons/react/24/solid";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function DirectMessages() {
  const server_url = useServerUrl();
  const { data } = useSession();
  const { toast } = useToast();
  const [direct_message, setDirectMessage] = useState<Message[]>([]);

  useEffect(() => {
    if (!data) return;

    async function getDirectMessages() {
      try {
        const response = await fetch(
          server_url + "/v1/get/direct-message/" + data?.user.id
        );

        const response_json = (await response.json()) as ServerResponse;

        if (response_json.status !== "OK") {
          toast({
            title: "Oops! something went wrong.",
            description: response_json.message,
          });
          return;
        }

        setDirectMessage(response_json.data as Message[]);
      } catch (error) {
        throw error;
      }
    }

    getDirectMessages();
  }, [data]);
  return (
    <div className="flex flex-col space-y-5 mx-2">
      <div className="flex items-center justify-between">
        <p className="font-bold text-sm">Direct messages</p>
        <Button variant="ghost" className="p-1 h-fit" type="button">
          <PencilSquareIcon className="h-4" />
        </Button>
      </div>
      <div className="relative my-5">
        <Input id="search" placeholder="find conversation" autoComplete="off" />
        <Label
          htmlFor="search"
          className="absolute top-1/2 right-3 -translate-y-1/2"
        >
          <MagnifyingGlassIcon className="h-5" />
        </Label>
      </div>
      <ScrollArea className="h-[35dvh] my-2">
        <div className="mx-3 space-y-1"></div>
      </ScrollArea>
    </div>
  );
}
