import { FastifyInstance, FastifyPluginOptions } from "fastify";
import User from "../database/models/User";
import websocketMessage from "./websocket-message";
import {
  ConsumerPayload,
  DtlsParametersPayload,
  ProducerPayload,
  RtpCapabilitiesPayload,
  TransportParamsPayload,
  UserLobbyPayload,
  WebSocketMessage,
} from "../lib/types/websocket-types";
import WebSocket from "ws";
import Lobby from "../database/models/Lobby";
import Member from "../database/models/Member";
import { createWorker } from "mediasoup";
import {
  AppData,
  Consumer,
  Producer,
  Router,
  WebRtcTransport,
} from "mediasoup/node/lib/types";

const lobby_router = new Map<string, Router<AppData>>();

const user_sender_transports = new Map<string, WebRtcTransport<AppData>>();
const user_receiver_transports = new Map<string, WebRtcTransport<AppData>>();
const user_audio_producers = new Map<string, Producer<AppData>>();
const user_video_producers = new Map<string, Producer<AppData>>();
const user_video_consumer = new Map<string, Consumer<AppData>>();
const user_audio_consumer = new Map<string, Consumer<AppData>>();

export default async function mediasoupServer(
  fastify: FastifyInstance,
  options: FastifyPluginOptions & {
    online_user: Map<string, WebSocket>;
  }
) {
  try {
    const { online_user } = options;
    const redis = fastify.redis["storage"];
    let worker = await createWorker();

    fastify.get<{ Params: { user_id: string } }>(
      "/ws/:user_id",
      { websocket: true },
      async (socket, request) => {
        const { user_id } = request.params;

        const found_user = await User.exists({ _id: user_id }).select("_id");

        if (!found_user) {
          socket.send(websocketMessage("ERROR", "user does not exist"));
          socket.close();
          return;
        }
        await User.updateOne(
          { _id: user_id },
          {
            $set: { status: "ONLINE" },
          }
        );

        online_user.set(user_id, socket);

        worker.on("died", async (error) => {
          fastify.log.error(error);

          worker = await createWorker();

          for (const [lobby_id, router] of lobby_router.entries()) {
            lobby_router.set(
              lobby_id,
              await worker.createRouter({
                mediaCodecs: router.rtpCapabilities.codecs,
              })
            );
            for (const user_id of await redis.smembers(
              "online-users-" + lobby_id
            )) {
              online_user
                .get(user_id)
                ?.send(websocketMessage("RESTART_CLIENT", ""));
            }
          }
        });
        socket.on("message", async (raw_data) => {
          const parsed_message: WebSocketMessage = JSON.parse(
            raw_data.toString()
          );

          switch (parsed_message.type) {
            case "JOIN_LOBBY": {
              const { user_id, lobby_id } =
                parsed_message.payload as UserLobbyPayload;
              const redis_lobby_key = "online-users-" + lobby_id;

              if (!(await redis.exists(redis_lobby_key))) {
                if (!(await Lobby.exists({ _id: lobby_id }))) {
                  online_user
                    .get(user_id)!
                    .send(websocketMessage("ERROR", "lobby does not exist"));
                  return;
                }
              }

              if (!(await Member.exists({ user: user_id }))) {
                online_user
                  .get(user_id)!
                  .send(
                    websocketMessage(
                      "ERROR",
                      "you are not a member of this lobby"
                    )
                  );
                return;
              }

              await redis.sadd(redis_lobby_key, user_id);

              if (!lobby_router.has(lobby_id)) {
                const router = await worker.createRouter({
                  mediaCodecs: [
                    {
                      kind: "audio",
                      mimeType: "audio/opus",
                      clockRate: 48000,
                      channels: 2,
                    },
                    {
                      kind: "video",
                      mimeType: "video/VP8",
                      clockRate: 90000,
                      parameters: {
                        "x-google-start-bitrate": 1000,
                      },
                    },
                  ],
                });
                lobby_router.set(lobby_id, router);
                fastify.log.info({}, "lobby router created");
              }
              online_user
                .get(user_id)
                ?.send(
                  websocketMessage(
                    "RTP_CAPABILITIES",
                    lobby_router.get(lobby_id)?.rtpCapabilities
                  )
                );
              break;
            }
            case "GET_TRANSPORT_PARAMS": {
              const { user_id, lobby_id } =
                parsed_message.payload as UserLobbyPayload;

              const sender_transport = await lobby_router
                .get(lobby_id)!
                .createWebRtcTransport({
                  listenIps: [
                    {
                      ip: "0.0.0.0",
                      announcedIp: "127.0.0.1",
                    },
                  ],
                  enableUdp: true,
                  enableTcp: true,
                  preferUdp: true,
                });

              const receiver_transport = await lobby_router
                .get(lobby_id)!
                .createWebRtcTransport({
                  listenIps: [
                    {
                      ip: "0.0.0.0",
                      announcedIp: "127.0.0.1",
                    },
                  ],
                  enableUdp: true,
                  enableTcp: true,
                  preferUdp: true,
                });

              sender_transport.on("dtlsstatechange", (state) => {
                if (state === "closed") sender_transport.close();
              });

              sender_transport.on("@close", () => {
                user_sender_transports.delete(user_id);
                fastify.log.error("transport closed");
              });

              receiver_transport.on("dtlsstatechange", (state) => {
                if (state === "closed") receiver_transport.close();
              });

              receiver_transport.on("@close", () => {
                user_receiver_transports.delete(user_id);
                fastify.log.error("transport closed");
              });

              user_sender_transports.set(user_id, sender_transport);
              user_receiver_transports.set(user_id, receiver_transport);

              online_user.get(user_id)?.send(
                websocketMessage("TRANSPORT_PARAMS", {
                  sender: {
                    id: sender_transport.id,
                    iceParameters: sender_transport.iceParameters,
                    iceCandidates: sender_transport.iceCandidates,
                    dtlsParameters: sender_transport.dtlsParameters,
                  },
                  receiver: {
                    id: receiver_transport.id,
                    iceParameters: receiver_transport.iceParameters,
                    iceCandidates: receiver_transport.iceCandidates,
                    dtlsParameters: receiver_transport.dtlsParameters,
                  },
                } as TransportParamsPayload)
              );
              break;
            }
            case "CONNECT_SENDER_TRANSPORT": {
              const payload = parsed_message.payload as DtlsParametersPayload;
              try {
                await user_sender_transports
                  .get(payload.user_id)
                  ?.connect({ dtlsParameters: payload.dtlsParameters });

                break;
              } catch (error) {
                fastify.log.error(error);
                online_user
                  .get(payload.user_id)
                  ?.send(websocketMessage("ERROR", error));
                break;
              }
            }
            case "CONNECT_RECEIVER_TRANSPORT": {
              const payload = parsed_message.payload as DtlsParametersPayload;

              try {
                await user_receiver_transports
                  .get(payload.user_id)
                  ?.connect({ dtlsParameters: payload.dtlsParameters });
                break;
              } catch (error) {
                fastify.log.error(error);
                online_user
                  .get(payload.user_id)
                  ?.send(websocketMessage("ERROR", error));
                break;
              }
            }
            case "CREATE_PRODUCER": {
              const payload = parsed_message.payload as ProducerPayload;
              try {
                const producer = await user_sender_transports
                  .get(payload.user_id)
                  ?.produce({
                    kind: payload.params.kind,
                    rtpParameters: payload.params.rtpParameters,
                  });

                if (payload.params.kind === "video") {
                  user_video_producers.set(payload.user_id, producer!);
                } else {
                  user_audio_producers.set(payload.user_id, producer!);
                }

                producer?.on("transportclose", () => {
                  fastify.log.error("transport for this producer is closed");
                  producer.close();
                });

                online_user
                  .get(payload.user_id)
                  ?.send(websocketMessage("PRODUCER_ID", producer?.id));
                break;
              } catch (error) {
                fastify.log.error(error);
                online_user
                  .get(payload.user_id)
                  ?.send(websocketMessage("ERROR", error));
              }
            }
            case "CONSUME": {
              const payload = parsed_message.payload as RtpCapabilitiesPayload;
              const redis_lobby_key = "online-users-" + payload.lobby_id;

              for (const user_id of await redis.smembers(redis_lobby_key)) {
                try {
                  const router = lobby_router.get(payload.lobby_id);
                  const video_producer = user_video_producers.get(user_id);
                  const audio_producer = user_audio_producers.get(user_id);

                  if (video_producer) {
                    if (
                      router!.canConsume({
                        producerId: video_producer!.id,
                        rtpCapabilities: payload.rtpCapabilities,
                      })
                    ) {
                      const consumer = await user_receiver_transports
                        .get(payload.user_id)
                        ?.consume({
                          producerId: video_producer!.id,
                          rtpCapabilities: payload.rtpCapabilities,
                          paused: true,
                        });

                      if (!consumer) continue;

                      user_video_consumer.set(payload.user_id, consumer);
                      consumer.on("transportclose", () => {
                        console.log("transport close from consumer");
                        user_video_consumer.delete(payload.user_id);
                      });

                      consumer.on("producerclose", () => {
                        console.log("producer of consumer closed");
                        user_video_consumer.delete(payload.user_id);
                      });

                      online_user.get(payload.user_id)?.send(
                        websocketMessage("CONSUME_VIDEO", {
                          owner: user_id,
                          id: consumer.id,
                          kind: consumer.kind,
                          producer_id: video_producer!.id,
                          rtpParameters: consumer.rtpParameters,
                        } satisfies ConsumerPayload)
                      );
                    }
                  }
                  if (audio_producer) {
                    if (
                      router!.canConsume({
                        producerId: audio_producer!.id,
                        rtpCapabilities: payload.rtpCapabilities,
                      })
                    ) {
                      const consumer = await user_receiver_transports
                        .get(payload.user_id)
                        ?.consume({
                          producerId: audio_producer!.id,
                          rtpCapabilities: payload.rtpCapabilities,
                          paused: true,
                        });

                      if (!consumer) continue;

                      user_audio_consumer.set(payload.user_id, consumer);
                      consumer.on("transportclose", () => {
                        console.log("transport close from consumer");
                        user_audio_consumer.delete(payload.user_id);
                      });

                      consumer.on("producerclose", () => {
                        console.log("producer of consumer closed");
                        user_audio_consumer.delete(payload.user_id);
                      });

                      online_user.get(payload.user_id)?.send(
                        websocketMessage("CONSUME_AUDIO", {
                          owner: user_id,
                          id: consumer.id,
                          kind: consumer.kind,
                          producer_id: audio_producer!.id,
                          rtpParameters: consumer.rtpParameters,
                        } satisfies ConsumerPayload)
                      );
                    }
                  }
                } catch (error) {
                  fastify.log.error(error);
                  online_user
                    .get(payload.user_id)
                    ?.send(websocketMessage("ERROR", error));
                }
              }

              break;
            }
            case "RESUME_VIDEO_CONSUMER": {
              await user_video_consumer.get(parsed_message.payload)?.resume();

              break;
            }
            case "RESUME_AUDIO_CONSUMER": {
              await user_audio_consumer.get(parsed_message.payload)?.resume();
              break;
            }
            case "LEAVE_LOBBY": {
              const { user_id, lobby_id } =
                parsed_message.payload as UserLobbyPayload;
              const redis_lobby_key = "online-users-" + lobby_id;

              if (!(await redis.exists(redis_lobby_key))) return;

              await redis.srem(redis_lobby_key, user_id);

              if (!redis.scard(redis_lobby_key)) {
                redis.del(redis_lobby_key);
                return;
              }

              await redis.smembers(redis_lobby_key).then((members) =>
                members.forEach((user) => {
                  online_user
                    .get(user)
                    ?.send(websocketMessage("LEAVE_LOBBY", user_id));
                })
              );

              break;
            }
            default: {
              socket.send(websocketMessage("ERROR", "invalid payload type"));
            }
          }
        });
        socket.on("close", async () => {
          await User.updateOne(
            { _id: user_id },
            {
              $set: { status: "OFFLINE" },
            }
          );
          online_user.delete(user_id);
          user_video_producers.delete(user_id);
          user_audio_producers.delete(user_id);
          user_video_consumer.delete(user_id);
          user_audio_consumer.delete(user_id);
          user_sender_transports.delete(user_id);
          user_receiver_transports.delete(user_id);

          if (!(await redis.exists(redis_lobby_key))) return;
          await redis.srem(redis_lobby_key, user_id);

          if (!redis.scard(redis_lobby_key)) {
            redis.del(redis_lobby_key);
            return;
          }

          await redis.smembers(redis_lobby_key).then((members) =>
            members.forEach((user) => {
              online_user
                .get(user)
                ?.send(websocketMessage("LEAVE_LOBBY", user_id));
            })
          );
        });
        socket.on("error", async () => {
          online_user.delete(user_id);
          socket.close();
        });
      }
    );
  } catch (error) {
    fastify.log.error(error);
    fastify.websocketServer.close();
  }
}
