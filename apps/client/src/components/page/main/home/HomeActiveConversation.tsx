'use client';
import useActiveConversation from '@/components/hooks/queries/useActiveConversation';
import Loading from '@/components/svg/Loading';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { isGroupChat } from '@/lib/utils';
import { ChevronRight } from 'lucide-react';
import Link from 'next/link';
import UserAvatar from '../UserAvatar';

export default function HomeActiveConversations() {
  const { activeConversations, isError, isLoading, refetch, isRefetching } = useActiveConversation();
  return (
    <section className="grid gap-4">
      <p className="font-bold hidden md:block indent-4">Active Conversations</p>
      <div className="bg-muted w-full py-2 min-h-14 grid">
        {isLoading || isRefetching ? (
          <div className="flex flex-col items-center gap-1 h-fit w-fit px-2">
            <Skeleton className="h-10 w-10 rounded-full" />
            <Skeleton className="h-2 w-12" />
          </div>
        ) : isError ? (
          <div className="flex items-center place-self-center text-xs text-muted-foreground font-medium">
            <p>Something Went Wrong</p>
            <Button size="sm" variant="link" onClick={async () => await refetch()}>
              Retry
              {isRefetching && <Loading className="fill-primary h-5" />}
            </Button>
          </div>
        ) : Boolean(activeConversations?.length) ? (
          <div className="flex items-center justify-start gap-2 px-1">
            {activeConversations?.map((conversation) => {
              const isGroup = isGroupChat(conversation)
              return (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <Link key={conversation?.id} href={'/conversation/' + conversation.id}>
                        <div className="flex flex-col items-center gap-1 h-fit w-fit">
                          <UserAvatar
                            isOnline
                            src={isGroup ? conversation.photo?.url : conversation.members[0].photo?.url}
                            className="bg-background"
                          />
                          <p className="text-xs font-medium w-14 truncate">
                            {isGroup ? conversation.name : conversation.members[0].displayName}
                          </p>
                        </div>
                      </Link>
                    </TooltipTrigger>
                    <TooltipContent>{isGroup ? conversation.name : conversation.members[0].displayName}</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              );
            })}
            {activeConversations && activeConversations?.length > 6 && (
              <Link href="/" className="group">
                <div className="flex flex-col items-center gap-1 h-fit w-fit">
                  <Avatar>
                    <AvatarFallback className="bg-primary/70">
                      <ChevronRight className="aspect-square h-1/2 w-auto" />
                    </AvatarFallback>
                  </Avatar>
                  <p className="text-xs font-medium w-14 truncate group-hover:underline">see more</p>
                </div>
              </Link>
            )}
          </div>
        ) : (
          <p className="text-center text-xs text-muted-foreground font-medium my-auto">No active friends</p>
        )}
      </div>
    </section>
  );
}
