"use client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { PhoneOff, Video, VideoOff } from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";
import LobbyMic from "./LobbyMic";
import { AnimatePresence, motion } from "framer-motion";
import { useWebsocket } from "@/components/providers/WebsocketProvider";
import { useUserStream } from "@/components/providers/UserStreamProvider";
import {
  PeerConnectionMessage,
  UserLobbyPayload,
  UserMediaStream,
  WebSocketMessage,
} from "@/lib/types/websocket";
import websocketMessage from "@/lib/websocket/websocket-message";
import { useSession } from "next-auth/react";
import { useParams } from "next/navigation";
import { useRTCPeerConnection } from "@/components/providers/MediaDeviceProvider";
import { User } from "@/lib/types/server-response-data";

export default function LobbyVideo() {
  const [media_streams, setMediaStreams] = useState<
    Map<User["id"], { owner: string; stream: MediaStream | null }>
  >(new Map());
  const [user_media_streams, setUserMediaStream] = useState<
    Map<User["id"], MediaStream["id"]>
  >(new Map());
  const [status, setStatus] = useState({
    volume: 0,
    audio: false,
    video: false,
  });

  const user_stream = useUserStream();

  const websocket = useWebsocket();
  const rtc_connection = useRTCPeerConnection();
  const { data: session } = useSession();
  const params = useParams<{ id: string }>();
  const { cols, item_width, item_height } = useMemo(() => {
    if (media_streams.size <= 1)
      return { cols: 1, item_height: "100%", item_width: "auto" };
    if (media_streams.size <= 2)
      return { cols: 2, item_height: "auto", item_width: "50%" };
    if (media_streams.size <= 4)
      return { cols: 2, item_height: "50%", item_width: "auto" };
    if (media_streams.size <= 6)
      return { cols: 3, item_height: "auto", item_width: "33%" };
    return {
      cols: 4,
      item_width: "25%",
      item_height: "auto",
    };
  }, [media_streams.size]);

  useEffect(() => {
    if (
      !websocket ||
      !session ||
      !websocket.OPEN ||
      !user_stream.is_available ||
      !rtc_connection
    )
      return;

    setMediaStreams((prev) =>
      new Map(prev).set(user_stream.stream!.id, {
        owner: session.user.id,
        stream: user_stream.stream!,
      })
    );
    setUserMediaStream((prev) =>
      new Map(prev).set(session!.user.id, user_stream.stream!.id)
    );

    rtc_connection.addEventListener("icecandidate", ({ candidate }) =>
      user_media_streams.forEach((value, key) => {
        if (media_streams.get(value)?.stream === null) {
          websocket.send(
            websocketMessage("peer-connect", {
              type: "ICE_CANDIDATE",
              sender_id: session.user.id,
              receiver_id: key,
              data: candidate!,
            } satisfies PeerConnectionMessage)
          );
        }
      })
    );

    rtc_connection.addEventListener("track", ({ streams }) => {
      if (!streams.length) return;

      const m_stream = media_streams.get(streams[0].id);
      if (!m_stream) return;

      setMediaStreams((prev) =>
        new Map(prev).set(streams[0].id, {
          owner: m_stream.owner,
          stream: streams[0],
        })
      );
      setUserMediaStream((prev) =>
        new Map(prev).set(m_stream.owner, streams[0].id)
      );
    });

    user_stream.stream!.getTracks().forEach((track) => {
      rtc_connection.addTrack(track, user_stream.stream!);
    });

    websocket.addEventListener("open", () => {
      websocket.send(
        websocketMessage("USER_MEDIA_STREAM", {
          lobby_id: params.id,
          sender_id: session.user.id,
          user_media_stream_id: user_stream.stream!.id,
        } satisfies UserMediaStream)
      );
      websocket.send(
        websocketMessage("join", {
          user_id: session.user.id,
          lobby_id: params.id,
        })
      );
    });

    websocket.addEventListener("close", () => {
      websocket.send(
        websocketMessage("leave", {
          user_id: session.user.id,
          lobby_id: params.id,
        })
      );
    });
  }, [websocket, session, user_stream.is_available, rtc_connection]);

  useEffect(() => {
    if (!websocket || !user_stream || !rtc_connection || !session) return;

    websocket.addEventListener("message", async (event) => {
      const parsed_data = JSON.parse(event.data) as WebSocketMessage;

      switch (parsed_data.type) {
        case "USER_MEDIA_STREAM": {
          const payload = parsed_data.payload as UserMediaStream;

          user_media_streams.set(
            payload.sender_id,
            payload.user_media_stream_id
          );
          media_streams.set(payload.user_media_stream_id, {
            owner: payload.sender_id,
            stream: null,
          });

          break;
        }
        case "join": {
          const payload = parsed_data.payload as UserLobbyPayload;

          websocket.send(
            websocketMessage("USER_MEDIA_STREAM", {
              receiver_id: payload.user_id,
              sender_id: session.user.id,
              user_media_stream_id: user_stream.stream!.id,
            } satisfies UserMediaStream)
          );
          await rtc_connection.createOffer().then((offer) =>
            websocket.send(
              websocketMessage("peer-connect", {
                type: "OFFER",
                data: offer,
                sender_id: session!.user.id,
                receiver_id: payload.user_id,
              } satisfies PeerConnectionMessage)
            )
          );

          break;
        }
        case "peer-connect": {
          const payload = parsed_data.payload as PeerConnectionMessage;

          switch (payload.type) {
            case "OFFER": {
              await rtc_connection.setRemoteDescription(
                payload.data as RTCSessionDescriptionInit
              );

              await rtc_connection.createAnswer().then(async (answer) => {
                await rtc_connection.setLocalDescription(answer);

                websocket.send(
                  websocketMessage("peer-connect", {
                    type: "ANSWER",
                    sender_id: session!.user.id,
                    receiver_id: payload.sender_id,
                    data: answer,
                  } satisfies PeerConnectionMessage)
                );
              });
            }
            case "ANSWER": {
              await rtc_connection.setRemoteDescription(
                payload.data as RTCSessionDescriptionInit
              );
              break;
            }
            case "ICE_CANDIDATE": {
              await rtc_connection.addIceCandidate(
                payload.data as RTCIceCandidate
              );

              break;
            }
            default:
              break;
          }
          break;
        }
        default:
          break;
      }
    });
  }, [websocket, media_streams, rtc_connection, session, ]);

  return (
    <section className="h-full w-full max-h-vdh overflow-hidden grid grid-rows-[1fr_auto] place-items-center bg-secondary-foreground">
      <div className="w-full h-full overflow-hidden flex flex-wrap items-center justify-center">
        <AnimatePresence initial={false}>
          {Array.from(media_streams.values())
            .slice(0, Math.min(media_streams.size, 12))
            .map((media_stream, index) => (
              <motion.div
                animate={{
                  width: item_width,
                  height: item_height,
                }}
                key={index}
                className={cn(
                  "relative aspect-video rounded-lg p-1",
                  index >= media_streams.size - (media_streams.size % cols) &&
                    media_streams.size % cols !== 0
                    ? "sm:flex sm:justify-center"
                    : ""
                )}
              >
                <motion.video
                  key={index * 10}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  ref={(ref) => {
                    if (!media_stream.stream) return;
                    ref!.srcObject = media_stream.stream;
                  }}
                  autoPlay
                  playsInline
                  height={1080}
                  width={1920}
                  className="h-full w-full object-cover rounded-lg bg-muted "
                ></motion.video>
              </motion.div>
            ))}
        </AnimatePresence>
      </div>
      <div className="gap-4 flex  items-center justify-center px-2 py-4">
        <LobbyMic />
        <Button
          size="icon"
          onClick={() => setStatus((prev) => ({ ...prev, video: !prev.video }))}
        >
          <span className="h-4">
            {status.video ? (
              <VideoOff className="h-full w-auto" />
            ) : (
              <Video className="h-full w-auto" />
            )}
          </span>
        </Button>
        <Button size="icon" variant="destructive">
          <PhoneOff className="h-4 w-auto" />
        </Button>
      </div>
    </section>
  );
}
