"use client";
import React from "react";
import LobbyFooter from "./LobbyFooter";
import LobbyVideo from "./LobbyVideo";
import { useQuery, useQueryClient } from "@tanstack/react-query";

export default function LobbyVideoSection() {
  return (
    <section className="flex flex-col w-full h-full max-h-dvh bg-secondary items-center justify-center">
      <LobbyVideo />
      <LobbyFooter />
    </section>
  );
}
