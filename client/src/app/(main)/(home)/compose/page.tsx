import ComposeTo from "@/components/page/main/compose/ComposeTo";
import ComposeContent from "@/components/page/main/compose/ComposeContent";
import MainContent from "@/components/page/main/MainContent";

export default function page() {
  return (
    <MainContent className="grid grid-rows-[auto_1fr]">
      <ComposeTo />
      <ComposeContent />
    </MainContent>
  );
}
