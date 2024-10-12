import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { AuthOptions } from "next-auth";
import { GETRequest, POSTRequest } from "./server/requests";
import { User } from "./types/server-response-data";

const google_client_id = process.env.GOOGLE_CLIENT_ID;
if (!google_client_id)
  throw new Error("GOOGLE_CLIENT_ID is missing on your .env.local file");
const google_client_secret = process.env.GOOGLE_CLIENT_SECRET;
if (!google_client_secret)
  throw new Error("GOOGLE_CLIENT_SECRET is missing on your .env.local file");

const secret = process.env.NEXTAUTH_SECRET;
if (!secret)
  throw new Error("NEXTAUTH_SECRET is missing on your .env.local file");

const client_url = process.env.CLIENT_URL;
if (!client_url)
  throw new Error("CLIENT_URL is missing from your .env.local file");

const auth_options: AuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "username", type: "text", placeholder: "username" },
        password: {
          label: "password",
          type: "password",
          placeholder: "Password",
        },
      },
      async authorize(credentials) {
        try {
          const { data, status, message } = await POSTRequest<User>(
            "/v1/user/auth",
            {
              username: credentials?.username,
              password: credentials?.password,
            }
          );

          if (status !== "OK") throw new Error(message);

          return data;
        } catch (error) {
          throw error;
        }
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
    error: "/",
  },
  secret,
  debug: process.env.NODE_ENV === "development",
  jwt: {
    maxAge: 60 * 60 * 24 * 30,
  },
  callbacks: {
    async signIn({ user, profile }) {
      try {
        if (profile) {
          const { email } = user;
          const { status, data } = await GETRequest<User>(
            "/v1/user/@" + email?.substring(0, email.indexOf("@"))
          );

          if (status === "NOT_FOUND") {
            const { data } = await POSTRequest<User>("/v1/user", {
              username: "@" + email!.substring(0, email?.indexOf("@")),
              display_name: email!.substring(0, email?.indexOf("@")),
              email: email!,
              provider: "GOOGLE",
            } satisfies Omit<User, "id" | "photo" | "status" | "date_created" | "last_updated" | "is_new" | "lobbies"> & { provider: "GOOGLE" });

            await POSTRequest("/v1/user/photo", {
              owner: data.id,
              photo: {
                url: profile.picture,
              },
            });
          } else {
            if (data.is_new) {
              await POSTRequest("/v1/user/new", {
                owner: data.id,
                new: false,
              });
            }
          }
        }
        return true;
      } catch (error) {
        return false;
      }
    },
    async jwt({ token, profile, user, trigger, session }) {
      if (trigger == "update") return { ...token, ...session };

      delete token.sub;
      delete token.name;
      delete token.sub;
      delete token.picture;
      delete token.jti;

      try {
        if (profile) {
          const { data } = await GETRequest<User>(
            "/v1/user/@" +
              profile.email?.substring(0, profile.email.indexOf("@"))
          );

          return { ...token, ...data };
        }
        return { ...token, ...user };
      } catch (error) {
        throw error;
      }
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
