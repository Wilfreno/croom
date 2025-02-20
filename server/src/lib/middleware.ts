import { FastifyReply, FastifyRequest } from "fastify";
import JSONResponse from "./json-response";

export async function preValidation(request: FastifyRequest, reply: FastifyReply) {
  if (request.isUnauthenticated())
    return reply.code(401).send(JSONResponse("UNAUTHENTICATED", "user is not logged in"));
}
