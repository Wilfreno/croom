import { User } from "../../database/models/User";
import "@fastify/jwt";

declare module "@fastify/jwt" {
  interface FastifyJWT {
    payload: User & { id: string };
    user: User & { id: string };
  }
}
