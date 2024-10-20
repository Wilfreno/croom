"use client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { PhoneOff, Video, VideoOff } from "lucide-react";
import React, { useEffect, useMemo, useRef, useState } from "react";
import LobbyMic from "./LobbyMic";
import { AnimatePresence, motion } from "framer-motion";
import { useWebsocket } from "@/components/providers/WebsocketProvider";
import { useUserStream } from "@/components/providers/UserStreamProvider";
import {
  ConsumerPayload,
  ProducerPayload,
  RtpCapabilitiesPayload,
  TransportParamsPayload,
  UserLobbyPayload,
  WebSocketMessage,
} from "@/lib/types/websocket";
import websocketMessage from "@/lib/websocket/websocket-message";
import { useSession } from "next-auth/react";
import { useParams } from "next/navigation";
import { Device } from "mediasoup-client";
import { RtpCapabilities } from "mediasoup-client/lib/RtpParameters";
import { Transport } from "mediasoup-client/lib/Transport";
import { AppData } from "mediasoup-client/lib/types";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { GETRequest } from "@/lib/server/requests";
import { Lobby } from "@/lib/types/server-response-data";

export default function LobbyVideo() {
  const [status, setStatus] = useState({
    volume: 0,
    audio: false,
    video: false,
  });
  const [transport, setTransport] = useState<
    Record<"sender" | "receiver", Transport<AppData> | null>
  >({ sender: null, receiver: null });
  const [media_streams, setMediaStreams] = useState<Map<string, MediaStream>>(
    new Map()
  );
  const [device, setDevice] = useState<Device>();

  const user_stream = useUserStream();
  const websocket = useWebsocket();
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

  const { data: lobby, error } = useQuery({
    queryKey: ["lobby", params.id],
    queryFn: async () => {
      const { data, message, status } = await GETRequest<Lobby>(
        "/v1/lobby/" + params.id
      );

      if (status !== "OK") {
        throw new Error(message);
      }

      return data;
    },
  });

  useEffect(() => {
    if (!websocket || !user_stream.is_available || !session || !device) return;

    setDevice(new Device());

    function onOpen() {
      websocket?.send(
        websocketMessage("JOIN_LOBBY", {
          user_id: session?.user.id,
          lobby_id: params.id,
        } as UserLobbyPayload)
      );
    }

    async function onMessage(event: MessageEvent<any>) {
      const parsed_data = JSON.parse(event.data) as WebSocketMessage;

      switch (parsed_data.type) {
        case "RTP_CAPABILITIES": {
          try {
            await device!.load({
              routerRtpCapabilities: parsed_data.payload as RtpCapabilities,
            });

            websocket?.send(
              websocketMessage("GET_TRANSPORT_PARAMS", {
                lobby_id: params.id,
                user_id: session?.user.id,
              } as UserLobbyPayload)
            );
            break;
          } catch (error) {
            throw error;
          }
        }
        case "TRANSPORT_PARAMS": {
          const payload = parsed_data.payload as TransportParamsPayload;

          setTransport({
            sender: device!.createSendTransport(payload.sender),
            receiver: device!.createSendTransport(payload.receiver),
          });

          break;
        }

        default:
          break;
      }
    }
    websocket.addEventListener("open", onOpen);
    websocket.addEventListener("message", onMessage);

    return () => {
      websocket.removeEventListener("open", onOpen);
      websocket.removeEventListener("message", onMessage);
      websocket.close();
    };
  }, [websocket, user_stream.is_available, session, device]);

  useEffect(() => {
    if (
      !websocket ||
      !session ||
      !transport.sender ||
      !user_stream.is_available
    )
      return;

    transport.sender.on(
      "connect",
      async ({ dtlsParameters }, parametersTransmitted, isError) => {
        try {
          websocket.send(
            websocketMessage("CONNECT_SENDER_TRANSPORT", {
              user_id: session.user.id,
              dtlsParameters,
            })
          );
          parametersTransmitted();
        } catch (error) {
          isError(error as Error);
        }
      }
    );

    transport.sender.on(
      "produce",
      async (parameters, setProducerID, isError) => {
        try {
          websocket.send(
            websocketMessage("CREATE_PRODUCER", {
              params: {
                kind: parameters.kind,
                rtpParameters: parameters.rtpParameters,
                appData: parameters.appData,
              },
              user_id: session?.user.id,
            } as ProducerPayload)
          );
          websocket.addEventListener("message", async (event) => {
            const parsed_data = JSON.parse(event.data) as WebSocketMessage;

            switch (parsed_data.type) {
              case "PRODUCER_ID": {
                setProducerID({ id: parsed_data.payload as string });
                break;
              }
              default:
                break;
            }
          });
        } catch (error) {
          isError(error as Error);
        }
      }
    );

    (async function () {
      const video_producer = await transport.sender!.produce({
        // mediasoup params
        encodings: [
          {
            rid: "r0",
            maxBitrate: 100000,
            scalabilityMode: "S1T3",
          },
          {
            rid: "r1",
            maxBitrate: 300000,
            scalabilityMode: "S1T3",
          },
          {
            rid: "r2",
            maxBitrate: 900000,
            scalabilityMode: "S1T3",
          },
        ],
        codecOptions: {
          videoGoogleStartBitrate: 1000,
        },
        track: user_stream.stream!.getVideoTracks()[0],
      });

      const audio_producer = await transport.sender!.produce({
        track: user_stream.stream!.getAudioTracks()[0],
        codecOptions: {
          opusStereo: true,
          opusFec: true,
          opusDtx: true,
        },
        encodings: [
          {
            maxBitrate: 64000,
          },
        ],
      });
      video_producer.on("trackended", () => {
        console.log("video track ended");
      });

      video_producer.on("transportclose", () => {
        console.log(" video  transport ended");
      });

      audio_producer.on("trackended", () => {
        console.log("audio track ended");
      });

      audio_producer.on("transportclose", () => {
        console.log("audio transport ended");
      });
    })();

    return () => {
      if (transport.sender) transport.sender.close();
    };
  }, [transport.sender, websocket, session, user_stream.is_available]);

  useEffect(() => {
    if (!transport.receiver || !websocket || !session || !device) return;

    transport.receiver.on(
      "connect",
      async ({ dtlsParameters }, transportParamsTransmitted, isError) => {
        try {
          websocket.send(
            websocketMessage("CONNECT_RECEIVER_TRANSPORT", {
              user_id: session.user.id,
              dtlsParameters,
            })
          );

          transportParamsTransmitted();
        } catch (error) {
          isError(error as Error);
        }
      }
    );

    websocket.send(
      websocketMessage("CONSUME", {
        lobby_id: params.id,
        user_id: session.user.id,
        rtpCapabilities: device.rtpCapabilities,
      } satisfies RtpCapabilitiesPayload)
    );

    async function receiverTransportWebsocketMessage(event: MessageEvent<any>) {
      const parsed_data = JSON.parse(event.data) as WebSocketMessage;

      const payload = parsed_data.payload as ConsumerPayload;

      switch (parsed_data.type) {
        case "CONSUME_VIDEO": {
          const { track } = await transport.receiver!.consume({
            id: payload.id,
            producerId: payload.producer_id,
            kind: payload.kind,
            rtpParameters: payload.rtpParameters,
          });

          setMediaStreams((prev) =>
            new Map(prev).set(payload.owner, new MediaStream([track]))
          );

          websocket?.send(
            websocketMessage("RESUME_VIDEO_CONSUMER", session?.user.id)
          );
          break;
        }
        case "CONSUME_AUDIO": {
          const { track } = await transport.receiver!.consume({
            id: payload.id,
            producerId: payload.producer_id,
            kind: payload.kind,
            rtpParameters: payload.rtpParameters,
          });

          setMediaStreams((prev) =>
            new Map(prev).set(payload.owner, new MediaStream([track]))
          );
          break;
        }
        case "RESTART_CLIENT": {
          toast("An Error has occurred RELOAD YOUR PAGE");
          break;
        }
        default:
          break;
      }
    }

    websocket.addEventListener("message", receiverTransportWebsocketMessage);

    return () => {
      websocket.removeEventListener(
        "message",
        receiverTransportWebsocketMessage
      );

      if (transport.receiver) transport.receiver.close();
    };
  }, [transport.receiver, websocket, session, device]);

  if (error) throw error;

  return (
    <section className="h-full w-full max-h-vdh overflow-hidden grid grid-rows-[1fr_auto] place-items-center bg-secondary-foreground">
      <div className="w-full h-full overflow-hidden flex flex-wrap items-center justify-center">
        <AnimatePresence initial={false}>
          {Array.from(media_streams.entries())
            .slice(0, Math.min(media_streams.size, 12))
            .map((entry, index) => (
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
                    ref!.srcObject = entry[1];
                  }}
                  autoPlay
                  playsInline
                  height={1080}
                  width={1920}
                  className="h-full w-full object-cover rounded-lg bg-muted "
                ></motion.video>
                <h1 className="absolute top-full left-1/2 text-xl text-primary">
                  {
                    lobby?.members.find((member) => member.user.id === entry[0])
                      ?.user.display_name
                  }
                </h1>
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
