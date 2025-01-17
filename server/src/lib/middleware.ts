import { FastifyReply, FastifyRequest, HookHandlerDoneFunction } from "fastify";
import JSONResponse from "./json-response";

export async function preValidation(
  request: FastifyRequest,
  reply: FastifyReply,
  done: HookHandlerDoneFunction
) {
  if (request.isUnauthenticated()) return done(new Error("Unauthenticated"));
  done();
}
