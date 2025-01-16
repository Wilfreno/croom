"use client";
import { GETRequest } from "@/lib/server/requests";
import { User } from "@/lib/types/server-data-types";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import React, { createContext, useContext, useEffect, useState } from "react";
import croom_logo from "../../../public/croom-logo.svg";

const AuthContext = createContext<{
  session: { user: User | null };
  logout: () => Promise<void>;
  login: (
    strategy: "GOOGLE" | "LOCAL",
    credentials?: {
      username: string;
      password: string;
    }
  ) => Promise<void>;
  error: string | null;
} | null>(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context)
    throw new Error(
      "useSession hook is only available on components under SessionProvider"
    );
  return context;
}

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();
  const pathname = usePathname();

  const server_url = process.env.NEXT_PUBLIC_SERVER;
  if (!server_url)
    throw new Error("NEXT_PUBLIC_SERVER is missing from your .env.local file");

  async function getSession() {
    try {
      const { data, status, message } = await GETRequest<User>("/v1/auth/session");
      if (status !== "OK") throw new Error(message);
      setSession(data);
      g;
    } catch {
      if (!pathname.startsWith("/login") && !pathname.startsWith("/sign-up"))
        router.replace("/login");
      throw error;
    }
  }

  async function login(
    strategy: "GOOGLE" | "LOCAL",
    credentials: { username: string; password: string } | undefined
  ) {
    switch (strategy) {
      case "GOOGLE": {
        try {
          router.push(server_url + "/v1/auth/google/login");
        } catch (error) {
          setError("Oops! something went strong");
          throw error;
        }
      }
      case "LOCAL": {
        try {
          if (!credentials)
            throw new Error("LOCAL strategy requires username and password credentials");

          const { username, password } = credentials;
          if (!username)
            throw new Error(
              "username is required on the credentials and cannot be empty"
            );

          if (!password)
            throw new Error(
              "password is required on the credentials and cannot be empty"
            );

          const response = await fetch(server_url + "/v1/auth/local/login", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ username, password }),
          });

          if (!response.ok) {
            const response_json = await response.json();
            setError(response_json.message);
            return;
          }
          await getSession();
        } catch (error) {
          throw error;
        }
      }
    }
  }

  async function logout() {
    try {
      router.push(server_url + "/v1/auth/logout");
    } catch (error) {
      console.log(error);
    }
  }

  useEffect(() => {
    getSession();
  }, []);

  useEffect(() => {
    if (!session) return;
    if (pathname.startsWith("/login") || pathname.startsWith("/sign-up"))
      router.push("/");
  }, [session]);

  return (
    <AuthContext.Provider value={{ session: { user: session }, logout, login, error }}>
      {session ? (
        children
      ) : pathname.startsWith("/login") || pathname.startsWith("/sign-up") ? (
        children
      ) : (
        <section className="fixed z-50 w-full h-full bg-background">
          <div className="relative">
            <Image src={croom_logo} alt="logo" className="" />
          </div>
        </section>
      )}
    </AuthContext.Provider>
  );
}
