"use client";
import useConversation from "@/components/hooks/queries/useConversation";
import useConversationInfo from "@/components/hooks/queries/useConversationInfo";
import useInfoSidebarOpen from "@/components/hooks/queries/useInfoSidebarOpen";
import { useAuth } from "@/components/providers/AuthProvider";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { ArrowLeft } from "lucide-react";
import dynamic from "next/dynamic";
import { useParams } from "next/navigation";
import { useMemo } from "react";
import ConversationAvatar from "../ConversationAvatar";
import SidebarContent from "../SidebarContent";
import UserAvatar from "../UserAvatar";
import InfoCustomization from "./InfoCustomization";
import InfoMedia from "./InfoMedia";
import InfoPrivacyAndSupport from "./InfoPrivacyAndSupport";

const InfoAdminsAndMembers = dynamic(() => import("./InfoAdminsAndMembers"), {
  ssr: false,
});

export default function InfoSidebar() {
  const params = useParams<{ id: string }>();
  const { session } = useAuth();

  const { isOpen, setIsOpen } = useInfoSidebarOpen();
  const { data: conversation } = useConversation(params.id);

  const { data: conversationInfo } = useConversationInfo(conversation!);

  const hide = useMemo(() => {
    if (!conversation || !session.user) return true;

    if (conversation.status === "BLOCKED") {
      return session.user.id !== conversation.blocker;
    }

    return !conversation.members.some((member) => member.id !== session.user?.id);
  }, [conversation, session.user]);

  return (
    <SidebarContent className={cn("relative w-full shrink-0 md:w-72 lg:w-80 xl:w-[24rem]", !isOpen && "hidden")}>
      <Button variant="ghost" className="md:hidden absolute top-2 left-0" onClick={() => setIsOpen(false)}>
        <ArrowLeft className="h-6 w-auto" />
      </Button>
      <div className="flex flex-col items-center gap-4 my-10">
        {conversation ? (
          <ConversationAvatar
            conversation={conversation}
            currentUserId={session.user?.id}
            className="h-28 w-auto border"
            size="lg"
          />
        ) : (
          <UserAvatar isOnline={false} className="h-28 w-auto border" />
        )}
        <div className="text-center">
          <p className="font-medium text-lg truncate max-w-64">{conversationInfo?.conversationName}</p>
          {Boolean(conversationInfo?.lastOnline) && (
            <p className="text-xs font-medium text-muted-foreground">Online {conversationInfo?.lastOnline}</p>
          )}
        </div>
      </div>
      {!hide && (
        <ScrollArea className="h-[60dvh]">
          <div className="grid gap-2">
            <InfoCustomization />
            <InfoAdminsAndMembers />
            <InfoMedia />
            <InfoPrivacyAndSupport />
          </div>
        </ScrollArea>
      )}
    </SidebarContent>
  );
}
