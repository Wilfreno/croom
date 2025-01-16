import ConversationHeader from "@/components/page/main/conversation/ConversationHeader";
import ConversationMessageInput from "@/components/page/main/conversation/ConversationMessageInput";
import ConversationMessages from "@/components/page/main/conversation/ConversationMessages";
import MainContent from "@/components/page/main/MainContent";
import { getQueryClient } from "@/lib/react-query/get-query-client";
import { getConvoOptions } from "@/lib/react-query/prefetch-query-options";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";

export default async function page({ params }: { params: Promise<{ id: string }> }) {
  const query_client = getQueryClient();
  const convo_id = (await params).id;

  await query_client.prefetchQuery(getConvoOptions(convo_id));

  return (
    <HydrationBoundary state={dehydrate(query_client)}>
      <MainContent className="grid grid-rows-[auto_1fr_auto]">
        <ConversationHeader />
        <ConversationMessages />
        <ConversationMessageInput />
      </MainContent>
    </HydrationBoundary>
  );
}
