import { FastifyInstance, FastifyPluginOptions } from "fastify";
import JSONResponse from "../../lib/json-response";
import { preValidation } from "../../lib/middleware";
import { UserSchema } from "../../database/models/User";
import Photo from "../../database/models/Photo";
import { ClientSession, startSession } from "mongoose";
import { UTApi } from "uploadthing/server";

export default function v1PhotoRouter(fastify: FastifyInstance, _: FastifyPluginOptions, done: () => void) {
  const upload_thing_api = new UTApi({});
  fastify.delete<{ Body: { id: string } }>("/", { preValidation }, async (request, reply) => {
    let session: ClientSession | null = null;
    try {
      const { id } = request.body;
      const user = request.user as UserSchema & { id: string };

      const found_photo = await Photo.findOne({ _id: id });
      if (!found_photo) return reply.code(404).send(JSONResponse("NOT_FOUND", "photo does not exist"));

      if (found_photo.owner.toString() !== user.id)
        return reply.code(403).send(JSONResponse("FORBIDDEN", "you are not the owner of this photo"));

      session = await startSession();
      session.startTransaction();

      await Photo.deleteOne({ _id: id }, { session });

      if (found_photo.key) await upload_thing_api.deleteFiles(found_photo.key);

      await session.commitTransaction();
      await session.endSession();

      return reply.code(200).send(JSONResponse("OK", "photo deleted"));
    } catch (error) {
      await session?.abortTransaction();
      fastify.log.error(error);
      return reply.code(500).send(JSONResponse("INTERNAL_SERVER_ERROR"));
    }
  });
  done();
}
