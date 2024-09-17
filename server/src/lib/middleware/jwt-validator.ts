import { FastifyReply, FastifyRequest } from "fastify";
import JSONResponse from "../json-response";

export default async function JWTValidator(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    await request.jwtVerify();
  } catch (error) {
    console.error(error);
    return reply.code(403).send(JSONResponse("UNAUTHORIZED"));
  }
}
