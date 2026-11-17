import useBlockConversation from '@/components/hooks/mutation/useBlockConversation.mutation';
import useConversation from '@/components/hooks/queries/useConversation';
import { useAuth } from '@/components/providers/AuthProvider';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import LeaveGroupDialog from '@/components/page/main/info/LeaveGroupDialog';
import ReportUserDialog from '@/components/page/main/info/ReportUserDialog';
import { ConversationStatus } from "@repo/enums";
import { ChevronDown, ChevronRight, ShieldMinus } from 'lucide-react';
import { useParams } from 'next/navigation';
import { useState } from 'react';

export default function InfoPrivacyAndSupport() {
  const [open, setOpen] = useState(false);

  const { session } = useAuth();
  const params = useParams<{ id: string }>();

  const { data: conversation } = useConversation(params.id);
  const { blockConversation, unblockConversation } = useBlockConversation();

  return (
    <Collapsible onOpenChange={setOpen}>
      <CollapsibleTrigger asChild>
        <Button variant="ghost" className="w-full justify-between font-semibold">
          <span>Privacy & Support</span>
          {open ? <ChevronDown className="h-4 w-auto" /> : <ChevronRight className="h-4 w-auto" />}
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="grid gap-2 p-2">
        {conversation ? <ReportUserDialog conversation={conversation} /> : null}
        {conversation?.isGroupChat ? (
          <LeaveGroupDialog conversation={conversation} />
        ) : conversation?.status === ConversationStatus.BLOCKED && conversation?.blocker === session.user?.id ? (
          <Button
            variant="secondary"
            className="w-full justify-start text-destructive"
            disabled={unblockConversation.isPending}
            onClick={() => unblockConversation.mutate(params.id)}
          >
            <span className="aspect-square h-fit w-auto p-2 rounded-full ">
              <ShieldMinus className="h-4 w-auto" />
            </span>
            <span>Unblock User</span>
          </Button>
        ) : (
          <Button
            variant="ghost"
            className="w-full justify-start"
            disabled={blockConversation.isPending}
            onClick={() => blockConversation.mutate(params.id)}
          >
            <span className="aspect-square h-fit w-auto p-2 bg-secondary rounded-full text-destructive">
              <ShieldMinus className="h-4 w-auto" />
            </span>
            <span>Block User</span>
          </Button>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
}
