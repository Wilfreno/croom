"use client";
import { createContext, useContext, useEffect, useState } from "react";

const RTCPeerConnectionContext = createContext<RTCPeerConnection | null>(null);

export function useRTCPeerConnection() {
  return useContext(RTCPeerConnectionContext);
}

export default function MediaDeviceProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [connection, setConnection] = useState<RTCPeerConnection | null>(null);

  useEffect(() => {
    if (!window) return;

    setConnection(new RTCPeerConnection());
  }, []);

  return (
    <RTCPeerConnectionContext.Provider value={connection}>
      {children}
    </RTCPeerConnectionContext.Provider>
  );
}
