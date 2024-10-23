import { FastifyInstance, FastifyPluginOptions } from "fastify";
import { ClientToServer, ServerToCLient } from "../lib/types/socketio-types";
import { createWorker } from "mediasoup";
import {
  AppData,
  Consumer,
  Producer,
  Router,
  WebRtcTransport,
} from "mediasoup/node/lib/types";
import { DefaultEventsMap, Socket } from "socket.io";
import Member from "../database/models/Member";

const routers = new Map<string, Router<AppData>>();
const user_producer_transports = new Map<string, WebRtcTransport<AppData>>();
const user_consumer_transports = new Map<string, WebRtcTransport<AppData>>();
const user_audio_producers = new Map<string, Producer<AppData>>();
const user_video_producers = new Map<string, Producer<AppData>>();
const user_video_consumer = new Map<string, Consumer<AppData>>();
const user_audio_consumer = new Map<string, Consumer<AppData>>();

export default async function mediasoupServer(
  fastify: FastifyInstance,
  options: FastifyPluginOptions & {
    socket: Socket<ClientToServer, ServerToCLient, DefaultEventsMap, unknown>;
    user_id: string;
  }
) {
  const redis = fastify.redis["storage"];
  try {
    const { socket, user_id } = options;
    let worker = await createWorker();

    worker.on("died", async (error) => {
      fastify.log.error(error);

      worker = await createWorker();

      for (const [lobby_id, router] of routers.entries()) {
        routers.set(
          lobby_id,
          await worker.createRouter({
            mediaCodecs: router.rtpCapabilities.codecs,
          })
        );
        for (const user_id of await redis.smembers(
          "online-users-" + lobby_id
        )) {
          socket.to(user_id).emit("RESTART_CLIENT");
        }
      }
    });

    socket.on("JOIN_ROOM", async ({ user_id, lobby_id }, callback) => {
      if (!(await Member.exists({ user: user_id, lobby: lobby_id }))) {
        socket.to(user_id).emit("ERROR", "you are not a member of this lobby");
      }

      redis.sadd("online-users-" + lobby_id, );


      if (!routers.has(lobby_id)) {
        routers.set(
          lobby_id,
          await worker.createRouter({
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
          })
        );
      }

      callback(routers.get(lobby_id)!.rtpCapabilities);
    });
    socket.on(
      "CREATE_SEND_TRANSPORT",
      async ({ user_id, lobby_id }, callback) => {
        try {
          const send_transport = await routers
            .get(lobby_id)
            ?.createWebRtcTransport({
              listenIps: [
                {
                  ip: "0.0.0.0", // replace with relevant IP address
                  announcedIp: "127.0.0.1",
                },
              ],
              enableUdp: true,
              enableTcp: true,
              preferUdp: true,
            });

          if (!send_transport) return;

          send_transport.on("dtlsstatechange", (dtlsState) => {
            if (dtlsState === "closed") {
              send_transport.close();
            }
          });
          send_transport.on("@close", () => {
            console.log("transport closed");
          });

          callback({
            id: send_transport.id,
            iceParameters: send_transport.iceParameters,
            iceCandidates: send_transport.iceCandidates,
            dtlsParameters: send_transport.dtlsParameters,
          });
        } catch (error) {
          fastify.log.error(error);
          socket
            .to(user_id)
            .emit(
              "ERROR",
              "something went wrong while creating send transport"
            );
        }
      }
    );


    socket.on("disconnect", async () => {
      user_video_producers.delete(user_id);
      user_audio_producers.delete(user_id);
      user_video_consumer.delete(user_id);
      user_audio_consumer.delete(user_id);
      user_producer_transports.delete(user_id);
      user_consumer_transports.delete(user_id);
    });
  } catch (error) {
    fastify.log.error(error);
    fastify.io.close();
  }
}
