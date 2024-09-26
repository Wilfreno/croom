"use client";

import { Button } from "@/components/ui/button";
import LobbyChatInput from "./LobbyChatInput";
import LobbyChats from "./LobbyChats";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { SquareChevronLeft, SquareChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
export default function LobbyChatSection() {
  const { data: open_chat } = useQuery({
    queryKey: ["open_chat"],
    initialData: true,
  });
  const query_client = useQueryClient();

  return (
    <>
      <Button
        size="icon"
        variant="ghost"
        className={cn(
          "w-fit fixed top-4 right-2",
          open_chat ? "hidden" : "inline-flex"
        )}
        onClick={() => {
          query_client.setQueryData(["open_chat"], true);
        }}
      >
        <SquareChevronLeft className="h-6 w-auto stroke-primary" />
      </Button>
      <motion.section
        initial={{ width: "30vw", opacity: 1, display: "grid" }}
        animate={{
          width: open_chat ? "30vw" : "0",
          display: open_chat ? "grid" : "none",
          opacity: open_chat ? 1 : 0,
        }}
        className={cn(
          "bg-primary-foreground flex flex-col gap-4 py-4",
          open_chat && "px-2"
        )}
      >
        <Button
          size="icon"
          variant="ghost"
          onClick={() => {
            query_client.setQueryData(["open_chat"], false);
          }}
        >
          <SquareChevronRight className="h-6 w-auto  stroke-primary" />
        </Button>
        <LobbyChats />
        <LobbyChatInput />
      </motion.section>
    </>
  );
}
