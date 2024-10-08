"use client";

import { Button } from "@/components/ui/button";
import LobbyChatInput from "./LobbyChatInput";
import LobbyChats from "./LobbyChats";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { SquareChevronLeft, SquareChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

import LobbyChatHeader from "./LobbyChatHeader";

export default function LobbyChatSection() {
  const { data: open_chat } = useQuery({
    queryKey: ["open_chat"],
    initialData: true,
  });
  const query_client = useQueryClient();

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
          <LobbyChatHeader />
        </div>
        <LobbyChats />
        <LobbyChatInput />
      </motion.section>
    </span>
  );
}
