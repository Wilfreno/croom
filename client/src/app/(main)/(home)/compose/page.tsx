import ComposeFoundMessages from "@/components/page/main/compose/ComposeFoundMessages";
import ComposeMessageInput from "@/components/page/main/compose/ComposeMessageInput";
import ComposeTo from "@/components/page/main/compose/ComposeTo";
import MainContent from "@/components/page/main/MainContent";

export default function page() {
  return (
    <MainContent className="grid grid-rows-[auto_1fr_auto]">
      <ComposeTo />
      <ComposeFoundMessages />
      <ComposeMessageInput />
    </MainContent>
  );
}
