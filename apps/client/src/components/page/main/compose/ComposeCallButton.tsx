'use client';
import useConversation from '@/components/hooks/queries/useConversation';
import useConversationInfo from '@/components/hooks/queries/useConversationInfo';
import useSearchConversationsByMembers from '@/components/hooks/queries/useSearchConversationsByMember';
import StartCallButton from '../conversation/StartCallButton';

export default function ComposeCallButton({ selectedUsers }: { selectedUsers: string[][] }) {
  const { foundConversations, isSearching } = useSearchConversationsByMembers(selectedUsers);
  const sharedConversationId = foundConversations?.length === 1 ? foundConversations[0].id : undefined;
  const hasSeveralConversations = (foundConversations?.length ?? 0) > 1;
  const { data: conversation } = useConversation(sharedConversationId);
  const { data: conversationInfo } = useConversationInfo(conversation);

  if (!selectedUsers.length || isSearching || hasSeveralConversations) return null;

  const selectedNames = selectedUsers.map(([, displayName]) => displayName).join(', ');

  return (
    <div className="shrink-0">
      <StartCallButton
        conversationId={sharedConversationId}
        conversation={conversation}
        conversationInfo={{ ...conversationInfo, conversationName: conversationInfo?.conversationName || selectedNames }}
        newConversationMemberIds={selectedUsers.map(([userId]) => userId)}
      />
    </div>
  );
}
