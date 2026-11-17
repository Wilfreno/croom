'use client';
import useConversation from '@/components/hooks/queries/useConversation';
import { getMemberNickname } from '@/lib/utils';
import { useParams } from 'next/navigation';

export default function useCallMemberNickname(userId: string) {
  const { id: conversationId } = useParams<{ id: string }>();
  const { data: conversation } = useConversation(conversationId);
  return getMemberNickname(conversation, userId);
}
