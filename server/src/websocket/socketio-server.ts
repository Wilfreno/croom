import { FastifyInstance, FastifyPluginOptions } from "fastify";
import User from "../database/models/User";
import { MessagePayload } from "../lib/types/socketio-types";

export default function socketIOServer(
  fastify: FastifyInstance,
  _: FastifyPluginOptions,
  done: () => void
) {
  const { redis } = fastify;

  redis["sub"].subscribe("MESSAGE");
  redis["sub"].subscribe("NOTIFICATION");

  fastify.io.of("/io").on("connection", async (socket) => {
    try {
      const user_id = socket.handshake.auth.user_id as string;

      if (!(await User.exists({ _id: user_id }))) {
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
      socket.on("disconnect", async () => {
        await User.updateOne(
          { _id: user_id },
          { $set: { status: "OFFLINE", last_online: new Date() } }
        );
      });
    } catch (error) {
      fastify.log.error(error);
      socket.disconnect();
    }
  });
  redis["sub"].on("message", async (channel, message) => {
    switch (channel) {
      case "MESSAGE": {
        const parsed_message = JSON.parse(message) as MessagePayload;
        parsed_message.conversation.members.forEach((user) => {
          if (user !== parsed_message.sender.id) {
            console.log("USER_ID", user);
            fastify.io.of("/io").to(user).emit("MESSAGE", parsed_message);
          }
        });
        break;
      }
      default:
        break;
    }
  });
  done();
}
