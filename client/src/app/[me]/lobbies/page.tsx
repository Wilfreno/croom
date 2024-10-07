import FindLobbies from "@/components/page/main/FindLobbies";
import Lobbies from "@/components/page/main/Lobbies";

export default function page() {
  return (
    <main className="grow h-full grid grid-rows-[auto_1fr] p-10 gap-10">
      <FindLobbies />
      <Lobbies />
    </main>
  );
}
