import { UserSchema } from "../../database/models/User";
import { PassportUser } from "@fastify/passport";
declare module "fastify" {
  interface PassportUser extends UserSchema {
    id: string;
  }
}
