'use client';
import { Message } from '@repo/types';
import { ClientToServer, ServerToCLient } from '@/types/socketio-types';
import { InfiniteData, useQueryClient } from '@tanstack/react-query';
import { usePathname } from 'next/navigation';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { toast } from 'sonner';
import useUserAgent from '../hooks/useUserAgent';
import MessageToast from '../page/main/conversation/MessageToast';
import { useAuth } from './AuthProvider';

const SocketIOContext = createContext<Socket<ServerToCLient, ClientToServer> | null>(null);

export function useSocketIO() {
  return useContext(SocketIOContext);
}

export default function SocketIOProvider({ children }: { children: React.ReactNode }) {
  const socketUrl = process.env.NEXT_PUBLIC_SERVER;
//   if (!socket_url) throw new Error('NEXT_PUBLIC_SERVER is missing from your .env.local file');

  const [socket, setSocket] = useState<Socket<ServerToCLient, ClientToServer> | null>(null);
  const { session } = useAuth();
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const { onMobile } = useUserAgent();

  function onMessage(message: Message) {
    console.log(message);
    console.log(pathname);
    console.log(pathname.startsWith('/conversation/' + message.conversation.id));
    if (pathname.startsWith('/conversation/' + message.conversation.id)) {
      queryClient.setQueryData<
        | InfiniteData<
            {
              pageParam: number;
              result: Message[];
            },
            unknown
          >
        | undefined
      >(['conversation', 'messages', message.conversation.id], (prev) => {
        if (!prev) return;

        return {
          ...prev,
          pages: prev.pages.map(({ pageParam, result }, index) => ({
            pageParam,
            result: index === prev.pages.length - 1 ? [...result, message] : result,
          })),
        };
      });
    } else {
      console.log(onMobile);
      toast.custom((toastId) => <MessageToast message={message} toastId={toastId} />, {
        duration: Infinity,
        className: 'rounded-lg w-full hover:h-fit',
        position: onMobile ? 'top-center' : 'bottom-right',
      });
    }
  }
  function onError(error: string) {
    toast(error);
  }

  useEffect(() => {
    if (!session.user) return;

    const socket: Socket<ServerToCLient, ClientToServer> = io(socketUrl + '/io', {
      auth: {
        userId: session.user.id,
      },
    });
    setSocket(socket);

    socket.on('MESSAGE', onMessage);
    socket.on('ERROR', onError);

    return () => {
      socket.off('ERROR', onError);
      socket.off('MESSAGE', onMessage);
    };
  }, [session.user, pathname, onMobile]);

  return <SocketIOContext.Provider value={socket}>{children}</SocketIOContext.Provider>;
}
