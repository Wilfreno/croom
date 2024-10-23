"use client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { PhoneOff, Video, VideoOff } from "lucide-react";
import React, { useEffect, useMemo, useRef, useState } from "react";
import LobbyMic from "./LobbyMic";
import { AnimatePresence, motion } from "framer-motion";
import { useUserStream } from "@/components/providers/UserStreamProvider";
import { useSession } from "next-auth/react";
import { useParams } from "next/navigation";
import { Device } from "mediasoup-client";
import { Transport } from "mediasoup-client/lib/Transport";
import { AppData, Consumer } from "mediasoup-client/lib/types";
import { useQuery } from "@tanstack/react-query";
import { GETRequest } from "@/lib/server/requests";
import { Lobby } from "@/lib/types/server-response-data";
import { useSocketIO } from "@/components/providers/SocketIOProvider";

export default function LobbyVideo() {
  const [status, setStatus] = useState({
    volume: 0,
    audio: false,
    video: false,
  });

  const [media_streams, setMediaStreams] = useState<Map<string, MediaStream>>(
    new Map()
  );
  const consume_transports = useRef<Map<string, Consumer<AppData>>>(new Map());

  const { stream: user_stream, video_track, audio_track } = useUserStream();

  const socket = useSocketIO();
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
    if (!socket || !user_stream || !session || !video_track || !audio_track)
      return;

    const device = new Device();
    let send_transport: Transport<AppData>;
    let receive_transport: Transport<AppData>;
    setMediaStreams((prev) => new Map(prev).set(session.user.id, user_stream));

    socket.emit(
      "JOIN_ROOM",
      { user_id: session.user.id, lobby_id: params.id },
      async (data) => {
        await device.load({ routerRtpCapabilities: data });

        socket.emit(
          "CREATE_SEND_TRANSPORT",
          { user_id: session.user.id, lobby_id: params.id },
          async (data) => {
            send_transport = device.createSendTransport(data);
            send_transport.on(
              "connect",
              async ({ dtlsParameters }, success) => {
                socket.emit("CONNECT_SEND_TRANSPORT", {
                  user_id: session.user.id,
                  dtls_parameters: dtlsParameters,
                });

                success();
              }
            );

            send_transport.on("produce", async (parameters, done) => {
              socket.emit(
                "CREATE_PRODUCER",
                { user_id: session.user.id, lobby_id: params.id },
                parameters,
                ({ id, producers_are_available }) => {
                  if (producers_are_available) {
                    socket.emit(
                      "GET_PRODUCERS",
                      {
                        user_id: session.user.id,
                        lobby_id: params.id,
                      },
                      (ids) => {
                        socket.emit(
                          "CREATE_RECEIVE_TRANSPORT",
                          { user_id: session.user.id },
                          (params) => {
                            receive_transport =
                              device.createRecvTransport(params);

                            receive_transport.on(
                              "connect",
                              async ({ dtlsParameters }, done) => {
                                socket.emit("CONNECT_RECEIVE_TRANSPORT", {
                                  user_id: session.user.id,
                                  dtls_parameters: dtlsParameters,
                                });

                                done();
                                for (const id of ids) {
                                  socket.emit(
                                    "CONSUME",
                                    {
                                      rtp_capabilities: device.rtpCapabilities,
                                      producer_id: id,
                                      user_id: session.user.id,
                                    },
                                    async ({
                                      id,
                                      kind,
                                      producer_id,
                                      rtp_parameters,
                                      owner_id,
                                    }) => {
                                      try {
                                        const consumer =
                                          await receive_transport.consume({
                                            id: id,
                                            producerId: producer_id,
                                            kind,
                                            rtpParameters: rtp_parameters,
                                          });

                                        consume_transports.current.set(
                                          owner_id,
                                          consumer
                                        );
                                        setMediaStreams((prev) =>
                                          new Map(prev).set(
                                            owner_id,
                                            new MediaStream([consumer.track])
                                          )
                                        );
                                      } catch (error) {
                                        throw error;
                                      }
                                    }
                                  );
                                }
                              }
                            );
                          }
                        );
                      }
                    );
                  }
                  done({ id });
                }
              );
            });

            send_transport.produce({
              track: video_track,
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
            });
            send_transport.produce({
              track: audio_track,
            });
          }
        );
      }
    );

    function onProducerCLose(owner_id: string) {
      consume_transports.current.get(owner_id)?.close();
      setMediaStreams((prev) => {
        const p = prev;
        p.delete(owner_id);
        return p;
      });
    }
    socket.on("PRODUCER_CLOSED", onProducerCLose);
    return () => {
      socket.off("PRODUCER_CLOSED", onProducerCLose);
    };
  }, [socket, user_stream, session, params.id, video_track, audio_track]);

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
