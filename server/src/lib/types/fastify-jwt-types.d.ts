import { User } from "src/database/models/User";

declare module "@fastify/jwt" {
  interface FastifyJWT {
    user: User & { id: string };
  }
}
