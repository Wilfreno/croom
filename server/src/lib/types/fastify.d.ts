import { UserSchema } from "src/database/models/User";

declare module "fastify" {
  interface PassportUser extends UserSchema {
    id: string;
  }
}
