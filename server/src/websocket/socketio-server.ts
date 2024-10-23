import { FastifyInstance, FastifyPluginOptions } from "fastify";
import redisSub from "./redis-channel-sub";
import mediasoupServer from "./mediasoup-server";
import User from "../database/models/User";

export default function socketIOServer(
  fastify: FastifyInstance,
  _: FastifyPluginOptions,
  done: () => void
) {
  fastify.io.of("/io/:id").on("connection", async (socket) => {
    const user_id = socket.handshake.query.id as string;

    const found_user = await User.exists({ _id: user_id }).select("_id");

    if (!found_user) {
      socket.emit("ERROR", "user does not exist");
      socket.disconnect();
      return;
    }
    await socket.join(user_id);

    await User.updateOne(
      { _id: user_id },
      {
        $set: { status: "ONLINE" },
      }
    );

    fastify.register(redisSub, { socket });
    fastify.register(mediasoupServer, { socket, user_id });
  });
  done();
}
