import { FastifyInstance, FastifyPluginOptions } from "fastify";
import Notification, {
  type Notification as NotificationType,
} from "../../database/models/Notification";
import { User } from "../../database/models/User";
import JSONResponse from "../../lib/json-response";

export default function v1NotificationRouter(
  fastify: FastifyInstance,
  _: FastifyPluginOptions,
  done: () => void
) {
  //create route

  //read route

  //update route
  fastify.patch<{
    Params: { key: keyof NotificationType };
    Body: { id: string; seen: boolean };
  }>(
    "/:key",
    { preValidation: async (request) => await request.jwtVerify() },
    async (request, reply) => {
      try {
        const { key } = request.params;
        const { id, seen } = request.body;
        const user = request.user as User & { id: string };

        const found_notification = await Notification.findOne({ _id: id });

        if (!found_notification)
          return reply
            .code(404)
            .send(JSONResponse("NOT_FOUND", "notification does not exist"));

        if (found_notification.receiver.toString() !== user.id)
          return reply
            .code(403)
            .send(
              JSONResponse("FORBIDDEN", "you cannot update this notification")
            );

        switch (key) {
          case "seen": {
            await Notification.updateOne(
              { _id: id },
              { $set: { seen, last_updated: new Date() } }
            );
            break;
          }
          default:
            return reply
              .code(400)
              .send(
                JSONResponse("BAD_REQUEST", "only seen field can be updated")
              );
        }

        return reply.code(200).send(JSONResponse("OK", "notification updated"));
      } catch (error) {
        fastify.log.error(error);
        return reply.code(500).send(JSONResponse("INTERNAL_SERVER_ERROR"));
      }
    }
  );

  //delete route

  done();
}
