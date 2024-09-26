"use client";

import LobbyChatInput from "./LobbyChatInput";
import LobbyChats from "./LobbyChats";

export default function LobbyChatSection() {
  return (
    <section className="bg-primary-foreground w-[30vw] grid grid-rows-[1fr_auto] px-2 pb-10">
      <LobbyChats />
      <LobbyChatInput />
    </section>
  );
}
