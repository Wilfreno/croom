'use client';
import { appendMessage, emitSocketEventAndWaitForServerReply, getNicknameNoticeText, incomingCallToastId, setCachedNicknames } from '@/lib/utils';
import type { MessagePages } from '@/types/message.types';
import { CALL_NO_LONGER_RINGING, CALL_RING_DURATION_MS, REMOVED_FROM_GROUP_CHAT } from '@repo/constants';
import { MessageNoticeType } from '@repo/enums';
import type {
  CallAnswerPayload,
  CallPayload,
  ClientToServerEvents,
  Conversation,
  ConversationMembersChangedPayload,
  IncomingCallPayload,
  Message,
  MessagePayload,
  ServerToClientEvents,
  UserStatusPayload,
} from '@repo/types';
import { useQueryClient } from '@tanstack/react-query';
import { usePathname, useRouter } from 'next/navigation';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { toast } from 'sonner';
import useUserAgent from '../hooks/useUserAgent';
import IncomingCallToast from '../page/call/IncomingCallToast';
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
  const router = useRouter();
  const queryClient = useQueryClient();
  const { onMobile } = useUserAgent();

  function onMessage(message: MessagePayload) {
    const conversationId = message.conversation.id;

    const isNicknameNotice = message.notice?.type === MessageNoticeType.NICKNAME;
    const isCallNoticeMessage = Boolean(message.notice) && !isNicknameNotice;

    if (isNicknameNotice)
      setCachedNicknames(queryClient, { conversationId, userId: session.user?.id }, () => message.conversation.nicknames);
    if (isCallNoticeMessage) {
      queryClient.invalidateQueries({ queryKey: [session.user?.id, 'conversations'] });
      queryClient.invalidateQueries({ queryKey: ['active', 'conversations', session.user?.id] });
    }

    const isViewingConversation =
      pathname.startsWith('/conversation/' + conversationId) || pathname.startsWith('/call/' + conversationId);

    if (isViewingConversation) {
      const newMessage: Message = { ...message, conversation: conversationId };

      queryClient.setQueryData<MessagePages>(
        ['conversation', 'messages', conversationId],
        (prev) => prev && appendMessage(prev, newMessage),
      );
    } else if (message.notice) {
      if (isCallNoticeMessage || message.notice.user !== session.user?.id) return;
      toast(
        getNicknameNoticeText({
          notice: message.notice,
          actorId: message.sender.id,
          actorName: message.sender.displayName,
          targetName: '',
          currentUserId: session.user?.id,
        }),
      );
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
  async function acceptCall(socket: Socket<ServerToClientEvents, ClientToServerEvents>, conversationId: string) {
    const reply = await emitSocketEventAndWaitForServerReply(socket, 'CALL_ACCEPT', { conversationId }).catch(() => null);
    if (reply?.isAccepted) router.push(`/call/${conversationId}`);
    else toast(CALL_NO_LONGER_RINGING);
  }
    function onIncomingCall(socket: Socket<ServerToClientEvents, ClientToServerEvents>, call: IncomingCallPayload) {
    const conversationId = call.conversationId;
    toast.custom(
      (toastId) => (
        <IncomingCallToast
          call={call}
          toastId={toastId}
          onAccept={() => acceptCall(socket, conversationId)}
          onDecline={() => socket.emit('CALL_DECLINE', { conversationId })}
        />
      ),
      {
        id: incomingCallToastId(conversationId), // a repeated ring from the same call replaces the toast
        duration: CALL_RING_DURATION_MS,
        className: 'w-full',
        position: 'top-center',
      },
    );
  }
  function onCallCancelled({ conversationId }: CallPayload) {
    toast.dismiss(incomingCallToastId(conversationId));
  }
  function onCallAnswered({ conversationId, userId }: CallAnswerPayload) {
    if (userId === session.user?.id) toast.dismiss(incomingCallToastId(conversationId));
  }
  function onMembersChanged({ conversationId, removedMemberId }: ConversationMembersChangedPayload) {
    const userId = session.user?.id;
    const listKeys = [
      [userId, 'conversations'],
      ['active', 'conversations', userId],
    ];

    if (removedMemberId === userId) {
      toast(REMOVED_FROM_GROUP_CHAT);
      for (const queryKey of listKeys)
        queryClient.setQueryData<Conversation[]>(queryKey, (prev) =>
          prev?.filter((conversation) => conversation.id !== conversationId),
        );
      if (pathname.startsWith('/conversation/' + conversationId)) router.push('/');
      queryClient.removeQueries({ queryKey: ['conversation', conversationId] });
      queryClient.removeQueries({ queryKey: ['conversation', 'messages', conversationId] });
      return;
    }

    queryClient.invalidateQueries({ exact: true, queryKey: ['conversation', conversationId] });
    for (const queryKey of listKeys) queryClient.invalidateQueries({ queryKey });
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
    function onConnectError(error: Error) {
      if (!socket.active) toast(error.message);
    }

    socket.on('MESSAGE', onMessage);
    socket.on('USER_STATUS', onUserStatus);
    socket.on('ERROR', onError);

    socket.on('connect_error', onConnectError);
    function onIncomingCallFromSocket(call: IncomingCallPayload) {
      onIncomingCall(socket, call);
    }
    socket.on('INCOMING_CALL', onIncomingCallFromSocket);
    socket.on('CALL_CANCELLED', onCallCancelled);
    socket.on('CALL_ACCEPTED', onCallAnswered);
    socket.on('CALL_DECLINED', onCallAnswered);
    socket.on('CONVERSATION_MEMBERS_CHANGED', onMembersChanged);

    return () => {
      socket?.off('USER_STATUS', onUserStatus);
      socket?.off('ERROR', onError);
      socket?.off('connect_error', onConnectError);
      socket?.off('INCOMING_CALL', onIncomingCallFromSocket);
      socket?.off('CALL_CANCELLED', onCallCancelled);
      socket?.off('CALL_ACCEPTED', onCallAnswered);
      socket?.off('CALL_DECLINED', onCallAnswered);
      socket?.off('CONVERSATION_MEMBERS_CHANGED', onMembersChanged);
      socket?.off('MESSAGE', onMessage);
      socket?.disconnect();
    };
  }, [session.user, pathname, onMobile]);

  return <SocketIOContext.Provider value={socket}>{children}</SocketIOContext.Provider>;
}
