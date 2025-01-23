import ConversationHeader from "@/components/page/main/conversation/ConversationHeader";
import ConversationMessageInput from "@/components/page/main/conversation/ConversationMessageInput";
import ConversationMessages from "@/components/page/main/conversation/ConversationMessages";
import MainContent from "@/components/page/main/MainContent";

export default async function page() {
  return (
    <MainContent className="grid grid-rows-[auto_1fr_auto]">
      <ConversationHeader />
      <ConversationMessages />
      <ConversationMessageInput />
    </MainContent>
  );
}
