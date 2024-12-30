"use client";
import { useQuery } from "@tanstack/react-query";
import SidebarContent from "../SidebarContent";
import { cn } from "@/lib/utils";
import { Conversation } from "@/lib/types/server-data-types";
import { getConvoOptions } from "@/lib/react-query/prefetch-query-options";
import { useParams } from "next/navigation";
import InfoCustomization from "./InfoCustomization";
import { useSession } from "next-auth/react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { UserRound } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import dynamic from "next/dynamic";

const InfoAdminsAndMembers = dynamic(() => import("./InfoAdminsAndMembers"), { ssr: false });

export default function InfoSidebar() {
  const params = useParams<{ id: string }>();
  const { data: session } = useSession();
  const { data: is_open } = useQuery({ queryKey: ["sidebar", "info", "open"], placeholderData: true });
  const { data: conversation } = useQuery<Conversation>(getConvoOptions(params.id));

  const { data: conversation_info } = useQuery<
    | {
        photo_url: string;
        conversation_name: string;
        status: "OFFLINE" | "ONLINE" | null;
        last_online: string;
      }
    | undefined
  >({
    enabled: !!session?.user.id && !!conversation,
    queryKey: ["conversation", "info", conversation],
    placeholderData: { photo_url: "", conversation_name: "", status: null, last_online: "" },
  });
  const { photo_url, conversation_name, status, last_online } = conversation_info!;

  return (
    <SidebarContent className={cn("", !is_open && "")}>
      <div className="flex flex-col items-center gap-4 my-10">
        <span className="relative">
          <Avatar className="aspect-square h-28 w-auto">
            <AvatarImage src={photo_url} />
            <AvatarFallback>
              <UserRound className="h-1/2 w-auto" />
            </AvatarFallback>
          </Avatar>
          {status === "ONLINE" && (
            <div className="bg-green-500 aspect-square h-8 border-2 border-background w-auto rounded-full absolute bottom-1 right-0"></div>
          )}
        </span>
        <div className="text-center">
          <p className="font-medium text-lg truncate max-w-72">{conversation_name}</p>
          {!!last_online && <p className="text-xs font-medium text-muted-foreground">Online {last_online}</p>}
        </div>
      </div>
      <ScrollArea className="h-[60dvh]">
        <div className="grid gap-4">
          <InfoCustomization />
          <InfoAdminsAndMembers />
        </div>
      </ScrollArea>
    </SidebarContent>
  );
}
