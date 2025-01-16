import { FastifyInstance, FastifyPluginOptions } from "fastify";
import v1UserRouter from "./user";
import v1OTPRouter from "./otp";
import v1SearchRouter from "./search";
import v1ConversationRouter from "./conversation";
import v1MessageRouter from "./message";
<<<<<<< HEAD
import v1AuthRouter from "./auth";

export default function v1Router(
  fastify: FastifyInstance,
  _: FastifyPluginOptions,
  done: () => void
) {
  fastify.register(v1AuthRouter, { prefix: "/auth" });

=======
// import v1LobbyRouter from "./lobby";
// import v1InviteRouter from "./invite";
// import v1MessageRouter from "./message";
// import v1NotificationRouter from "./notification";

export default function v1Router(fastify: FastifyInstance, _: FastifyPluginOptions, done: () => void) {
>>>>>>> 48594df86b677d2b1222ce8220c48d5ef0822e60
  fastify.register(v1UserRouter, { prefix: "/user" });
  fastify.register(v1OTPRouter, { prefix: "/otp" });
  fastify.register(v1ConversationRouter, { prefix: "/conversation" });
  fastify.register(v1MessageRouter, { prefix: "/message" });
  fastify.register(v1SearchRouter, { prefix: "/search" });
<<<<<<< HEAD
=======
  //   fastify.register(v1LobbyRouter, { prefix: "/lobby" });
  //   fastify.register(v1InviteRouter, { prefix: "/invite" });
  //   fastify.register(v1MessageRouter, { prefix: "/message" });
  //   fastify.register(v1NotificationRouter, { prefix: "/notification" });
>>>>>>> 48594df86b677d2b1222ce8220c48d5ef0822e60
  done();
}
