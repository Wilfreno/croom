import { User } from "../../database/models/User";
import "@fastify/jwt";

declare module "@fastify/jwt" {
  interface FastifyJWT {
    user: User & { id: string };
  }
}
