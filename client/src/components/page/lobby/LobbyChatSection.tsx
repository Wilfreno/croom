"use client";

import { Button } from "@/components/ui/button";
import LobbyChatInput from "./LobbyChatInput";
import LobbyChats from "./LobbyChats";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { SquareChevronLeft, SquareChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { useWebsocket } from "@/components/providers/WebsocketProvider";
import websocketMessage from "@/lib/websocket/websocket-message";
import { useSession } from "next-auth/react";
import { useEffect } from "react";
import { useParams } from "next/navigation";
import LobbyName from "./LobbyFooter";

export default function LobbyChatSection() {
  const websocket = useWebsocket();
  const { data } = useSession();
  const params = useParams<{ id: string }>();

  const { data: open_chat } = useQuery({
    queryKey: ["open_chat"],
    initialData: true,
  });
  const query_client = useQueryClient();

  useEffect(() => {
    if (!websocket || !data) return;

    if (websocket.CONNECTING) {
      websocket.send(
        websocketMessage("join", { user_id: data.user.id, lobby_id: params.id })
      );
    }

    return () => {
      if (websocket.CONNECTING)
        websocket.send(
          websocketMessage("leave", {
            user_id: data.user.id,
            lobby_id: params.id,
          })
        );
    };
  }, [websocket, data]);

  return (
    <span className="relative">
      <Button
        size="icon"
        variant="ghost"
        className={cn(
          "w-fit absolute top-4 right-2",
          open_chat ? "hidden" : "inline-flex"
        )}
        onClick={() => {
          query_client.setQueryData(["open_chat"], true);
        }}
      >
        <SquareChevronLeft className="h-6 w-auto stroke-primary" />
      </Button>
      <motion.section
        initial={{ width: "25vw", opacity: 1, display: "grid" }}
        animate={{
          width: open_chat ? "25vw" : "0",
          display: open_chat ? "grid" : "none",
          opacity: open_chat ? 1 : 0,
        }}
        className="bg-primary-foreground flex flex-col gap-4 h-full"
      >
        <div className="flex items-center bg-secondary shadow-md p-2">
          <Button
            size="icon"
            variant="ghost"
            onClick={() => {
              query_client.setQueryData(["open_chat"], false);
            }}
          >
            <SquareChevronRight className="h-6 w-auto  stroke-primary" />
          </Button>
          <LobbyName />
        </div>
        <LobbyChats />
        <LobbyChatInput />
      </motion.section>
    </span>
  );
}
