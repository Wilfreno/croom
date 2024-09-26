import React from "react";
import LobbyHeader from "./LobbyHeader";
import LobbyVideo from "./LobbyVideo";

export default function LobbyVideoSection() {
  return (
    <section className="grid items-center w-full h-full bg-secondary relative">
      <LobbyHeader />
      <LobbyVideo />
    </section>
  );
}
