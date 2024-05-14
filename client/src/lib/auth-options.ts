import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { AuthOptions } from "next-auth";
import { ServerResponse } from "./types/sever-response";
import { User } from "./types/user-type";

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

server_url = process.env.DEVELOPMENT_SERVER!;
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
        try {
          const login = await fetch(server_url + "/login", {
            method: "POST",
            headers: {
              "Content-type": "application/json",
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
        } catch (e) {
          throw e;
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
  callbacks: {
    async signIn({ user, profile }) {
      try {
        if (profile) {
          const { email } = user;
          const at_index = email?.indexOf("@");
          const email_name = email?.slice(1, at_index);
          const db_user = await fetch(server_url + "/user/email/" + email_name);

          if (!db_user) {
            await fetch(server_url + "/create/user", {
              method: "POST",
              headers: {
                "Conten-type": "application/json",
              },
              body: JSON.stringify({
                email: email!,
                display_name: profile.given_name,
                user_name: profile.given_name,
                photo: {
                  create: {
                    photo_url: profile.picture,
                  },
                },
                provider: "GOOGLE",
              }),
            });
          }
        }
        return true;
      } catch (error) {
        return false;
      }
    },
    async jwt({ token, profile, user }) {
      if (profile) {
        const db_user = await fetch(
          server_url + "/user/email/" + profile.email
        );

        return { ...token, ...db_user };
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
