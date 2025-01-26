"use client";
import React, { createContext, useContext, useEffect, useState } from "react";
import { toast } from "sonner";
import { io, Socket } from "socket.io-client";
import { ClientToServer, ServerToCLient } from "@/lib/types/socketio-types";
import { useAuth } from "./AuthProvider";
import { Message } from "@/lib/types/server-data-types";
import { usePathname } from "next/navigation";
import MessageToast from "../page/main/conversation/MessageToast";
import { InfiniteData, useQueryClient } from "@tanstack/react-query";

const SocketIOContext = createContext<Socket<ServerToCLient, ClientToServer> | null>(
  null
);

export function useSocketIO() {
  return useContext(SocketIOContext);
}

export default function SocketIOProvider({ children }: { children: React.ReactNode }) {
  const socket_url = process.env.NEXT_PUBLIC_SERVER;
  if (!socket_url)
    throw new Error("NEXT_PUBLIC_SERVER is missing from your .env.local file");

  const [socket, setSocket] = useState<Socket<ServerToCLient, ClientToServer> | null>(
    null
  );
  const { session } = useAuth();
  const pathname = usePathname();
  const query_client = useQueryClient();

  function onMessage(message: Message) {
    console.log(message);
    console.log(pathname);
    console.log(pathname.startsWith("/conversation/" + message.conversation.id));
    if (pathname.startsWith("/conversation/" + message.conversation.id)) {
      query_client.setQueryData<
        | InfiniteData<
            {
              page_param: number;
              result: Message[];
            },
            unknown
          >
        | undefined
      >(["conversation", "messages", message.conversation.id], (prev) => {
        if (!prev) return;

        return {
          ...prev,
          pages: prev.pages.map(({ page_param, result }, index) => ({
            page_param,
            result: index === prev.pages.length - 1 ? [...result, message] : result,
          })),
        };
      });
    } else {
      toast.custom((toast_id) => <MessageToast message={message} toast_id={toast_id} />, {
        duration: Infinity,
        className: "rounded-lg w-full hover:h-fit",
      });
    }
  }
  function onError(error: string) {
    toast(error);
  }

  useEffect(() => {
    if (!session.user) return;

    const socket: Socket<ServerToCLient, ClientToServer> = io(socket_url + "/io", {
      auth: {
        user_id: session.user.id,
      },
    });
    setSocket(socket);

    socket.on("MESSAGE", onMessage);
    socket.on("ERROR", onError);

    return () => {
      socket.off("ERROR", onError);
      socket.off("MESSAGE", onMessage);
    };
  }, [session.user]);

  return <SocketIOContext.Provider value={socket}>{children}</SocketIOContext.Provider>;
}
