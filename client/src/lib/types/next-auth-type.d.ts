import NextAuth, { Session } from "next-auth";
import { User } from "./client-types";

declare module "next-auth" {
  interface Session {
    user: User;
  }
}

declare module "next-auth" {
  interface Profile {
    given_name: string;
    family_name: string;
    picture: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT extends User {}
}
