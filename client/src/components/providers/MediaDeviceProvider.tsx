"use client";
import { createContext, useContext, useEffect, useState } from "react";

const UserMediaContext = createContext<MediaStream | null>(null);

export function useUserMedia() {
  return useContext(UserMediaContext);
}

export default function MediaDeviceProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [stream, setStream] = useState<MediaStream | null>(null);

  useEffect(() => {
    if (!navigator) return;

    navigator.mediaDevices
      .getUserMedia({
        audio: true,
        video: true,
      })
      .then((data) => setStream(data));
  }, []);

  return (
    <UserMediaContext.Provider value={stream}>
      {children}
    </UserMediaContext.Provider>
  );
}
