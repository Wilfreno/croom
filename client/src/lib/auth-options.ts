import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { AuthOptions } from "next-auth";
import { ServerResponse } from "./types/sever-response";
import { User } from "./types/client-types";

const google_client_id = process.env.GOOGLE_CLIENT_ID;
if (!google_client_id)
  throw new Error(" GOOGLE_CLIENT_ID is missing from your .env.local file");
const google_client_secret = process.env.GOOGLE_CLIENT_SECRET;
if (!google_client_secret)
  throw new Error(" GOOGLE_CLIENT_SECRET is missing from your .env.local file");

const secret = process.env.NEXTAUTH_SECRET;
if (!secret)
  throw new Error(" NEXTAUTH_SECRET is missing from your .env.local file");

let server_url: string;

server_url = process.env.NEXT_PUBLIC_DEVELOPMENT_SERVER!;
if (!server_url)
  throw new Error("DEVELOPMENT_SERVER is missing from your .env.local file");

// const facebook_client_id = process.env.FACEBOOK_CLIENT_ID;
// if (!facebook_client_id) throw new Error("FACEBOOK_CLIENT_ID");
// const facebook_client_secret = process.env.FACEBOOK_CLIENT_SECRET;
// if (!facebook_client_secret) throw new Error("FACEBOOK_CLIENT_SECRET");

const auth_options: AuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "email", type: "text", placeholder: "Email" },
        password: {
          label: "password",
          type: "password",
          placeholder: "Password",
        },
      },
      async authorize(credentials) {
        const login = await fetch(server_url + "v1/user/authenticate", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: credentials?.email,
            password: credentials?.password,
          }),
        });
        const login_json: ServerResponse = await login.json();

        if (login_json.status !== "OK") {
          throw new Error(login_json.message);
        }
        const user = login_json.data as User;
        return user;
      },
    }),
    GoogleProvider({
      clientId: google_client_id,
      clientSecret: google_client_secret,
    }),
    // FacebookProvider({
    //   clientId: facebook_client_id,
    //   clientSecret: facebook_client_secret,
    // }),
  ],
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  secret,
  debug: process.env.NODE_ENV === "development",
  callbacks: {
    async jwt({ token, profile, user, account, session, trigger }) {
      delete token.sub;
      delete token.name;
      delete token.sub;
      delete token.picture;
      delete token.jti;

      if (trigger === "update" && session) {
        return { ...token, ...session };
      }

      if (profile && account) {
        let token_user: User;
        const server_response = await fetch(
          server_url + "/v1/user/email/" + profile.email
        );
        const server_json = await server_response.json();

        if (server_json.status === "OK") {
          token_user = server_json.data;
        } else {
          token_user = {
            id: "",
            display_name: "",
            user_name: "",
            email: profile.email!,
            profile_photo: {
              owner_id: "",
              id: profile.sub!,
              url: profile.picture,
              date_created: new Date(),
            },
            birth_date: undefined,
            date_created: undefined,
          };
        }

        return { ...token, ...token_user };
      }
      return { ...token, ...user };
    },
    async session({ session, token }) {
      try {
        session.user = token as any;
        return session;
      } catch (error) {
        throw error;
      }
    },
  },
};

export default auth_options;
