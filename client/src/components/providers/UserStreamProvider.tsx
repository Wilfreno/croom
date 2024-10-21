"use client";
import { useSession } from "next-auth/react";
import { createContext, useContext, useEffect, useState } from "react";

const UserMediaContext = createContext<{
  is_available: boolean;
  cameras: MediaDeviceInfo[];
  current_camera: string;
  changeCamera: (device_id: string) => Promise<void>;
  speakers: MediaDeviceInfo[];
  microphones: MediaDeviceInfo[];
  stream: MediaStream | null;
  video_track: MediaStreamTrack | null;
  audio_track: MediaStreamTrack | null;
}>({
  is_available: false,
  cameras: [],
  current_camera: "",
  changeCamera: async (device_id: string) => {
    return;
  },
  speakers: [],
  microphones: [],
  stream: null,
  video_track: null,
  audio_track: null,
});

export function useUserStream() {
  return useContext(UserMediaContext);
}

export default function UserStreamProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [current_camera, setCurrentCamera] = useState("");
  const [device_info, setDeviceInfo] = useState<
    Record<"cameras" | "microphones" | "speakers", MediaDeviceInfo[]>
  >({
    cameras: [],
    microphones: [],
    speakers: [],
  });
  const { data: session } = useSession();

  async function getUserMedia(device_id?: string) {
    await navigator.mediaDevices
      .getUserMedia({
        audio: true,
        video: device_id
          ? { deviceId: { exact: device_id } }
          : { facingMode: "user" },
      })
      .then((user_media) => {
        setCurrentCamera(user_media.getVideoTracks()[0].label);
        setStream(user_media);
      });
  }

  async function changeCamera(device_id: string) {
    await getUserMedia(device_id);
  }

  useEffect(() => {
    if (!navigator || !session) return;

    (async function () {
      await navigator.mediaDevices.enumerateDevices().then((devices) =>
        devices.forEach((device) => {
          setDeviceInfo((prev) => {
            switch (device.kind) {
              case "videoinput": {
                return { ...prev, cameras: [...prev.cameras, device] };
              }
              case "audioinput": {
                return { ...prev, microphones: [...prev.microphones, device] };
              }
              case "audiooutput": {
                return { ...prev, speakers: [...prev.speakers, device] };
              }
              default:
                return prev;
            }
          });
        })
      );
    })();
    getUserMedia();
  }, [session]);

  return (
    <UserMediaContext.Provider
      value={{
        is_available: !!stream,
        stream,
        cameras: device_info.cameras,
        current_camera,
        changeCamera,
        speakers: device_info.speakers,
        microphones: device_info.microphones,
        video_track: stream!.getVideoTracks()[0],
        audio_track: stream!.getAudioTracks()[0],
      }}
    >
      {children}
    </UserMediaContext.Provider>
  );
}
