'use client';
import type {
  ClientToServerEvents,
  Message,
  MessagePayload,
  ServerToClientEvents,
  UserStatusPayload,
} from '@repo/types';
import { InfiniteData, useQueryClient } from '@tanstack/react-query';
import { usePathname } from 'next/navigation';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { toast } from 'sonner';
import useUserAgent from '../hooks/useUserAgent';
import MessageToast from '../page/main/conversation/MessageToast';
import { useAuth } from './AuthProvider';

const SocketIOContext = createContext<Socket<ServerToClientEvents, ClientToServerEvents> | null>(null);

export function useSocketIO() {
  return useContext(SocketIOContext);
}

export default function SocketIOProvider({ children }: { children: React.ReactNode }) {
  const socketUrl = process.env.NEXT_PUBLIC_SERVER;

  const [socket, setSocket] = useState<Socket<ServerToClientEvents, ClientToServerEvents> | null>(null);
  const { session } = useAuth();
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const { onMobile } = useUserAgent();

  function onMessage(message: MessagePayload) {
    const conversationId = message.conversation.id;

    if (pathname.startsWith('/conversation/' + conversationId)) {
      const newMessage: Message = { ...message, conversation: conversationId };

      queryClient.setQueryData<
        | InfiniteData<
            {
              pageParam: number;
              result: Message[];
            },
            unknown
          >
        | undefined
      >(['conversation', 'messages', conversationId], (prev) => {
        if (!prev) return;

        return {
          ...prev,
          pages: prev.pages.map(({ pageParam, result }, index) => ({
            pageParam,
            result: index === prev.pages.length - 1 ? [...result, newMessage] : result,
          })),
        };
      });
    } else {
      toast.custom((toastId) => <MessageToast message={message} toastId={toastId} />, {
        duration: Infinity,
        className: 'rounded-lg w-full hover:h-fit',
        position: onMobile ? 'top-center' : 'bottom-right',
      });
    }
  }
  function onUserStatus(_payload: UserStatusPayload) {
    // Member statuses live inside the conversation queries; refetch them so avatars and "last online" update.
    queryClient.invalidateQueries({
      predicate: ({ queryKey }) =>
        queryKey.includes('conversations') || (queryKey[0] === 'conversation' && queryKey[1] !== 'messages'),
    });
  }
  function onError(error: string) {
    toast(error);
  }

  useEffect(() => {
    if (!session.user) return;

    const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io(socketUrl + '/io', {
      withCredentials: true,
    });
    setSocket(socket);

    socket.on('MESSAGE', onMessage);
    socket.on('USER_STATUS', onUserStatus);
    socket.on('ERROR', onError);

    return () => {
      socket?.off('USER_STATUS', onUserStatus);
      socket?.off('ERROR', onError);
      socket?.off('MESSAGE', onMessage);
      socket?.disconnect();
    };
  }, [session.user, pathname, onMobile]);

  return <SocketIOContext.Provider value={socket}>{children}</SocketIOContext.Provider>;
}
