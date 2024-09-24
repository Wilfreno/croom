import LobbyChat from "@/components/lobby/LobbyChat";
import LobbyVideo from "@/components/lobby/LobbyVideo";

export default function page() {
  return (
    <main className="grid grid-cols-[1fr_auto] w-full h-full">
      <LobbyVideo />
      <LobbyChat />
    </main>
  );
}
