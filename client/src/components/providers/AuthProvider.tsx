"use client";
import { GETRequest, PATCHRequest, POSTRequest } from "@/lib/server/requests";
import { User } from "@/lib/types/server-data-types";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import React, { createContext, useContext, useEffect, useState } from "react";
import croom_logo from "../../../public/croom-logo.svg";
import { toast } from "sonner";

const AuthContext = createContext<{
  session: { user: User | null; update: (data: Partial<User>) => Promise<void> };
  logout: () => Promise<void>;
  login: (
    strategy: "GOOGLE" | "LOCAL",
    credentials?: {
      username: string;
      password: string;
    }
  ) => Promise<void>;
  signup: {
    submitForm: (data: {
      email: string;
      username: string;
      password: string;
      display_name: string;
      pin: string;
    }) => Promise<void>;
    createOTP: (email: string) => Promise<void>;
  };
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

  const router = useRouter();
  const pathname = usePathname();

  const server_url = process.env.NEXT_PUBLIC_SERVER;
  if (!server_url)
    throw new Error("NEXT_PUBLIC_SERVER is missing from your .env.local file");

  async function getSession() {
    try {
      const { data, status } = await GETRequest<User>("/v1/auth/session");

      if (status !== "OK") {
        if (!pathname.startsWith("/login") && !pathname.startsWith("/sign-up"))
          router.replace("/login");
        return;
      }

      setSession(data);
    } catch (error) {
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
            toast.error(response_json.message);
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

  async function createOTP(email: string) {
    try {
      const { status, message } = await POSTRequest("/v1/otp", {
        email,
      });

      if (status !== "CREATED") throw new Error(message);
    } catch (error) {
      toast.error((error as Error).message);
    }
  }

  async function submitForm({
    email,
    password,
    username,
    display_name,
    pin,
  }: {
    email: string;
    username: string;
    password: string;
    display_name: string;
    pin: string;
  }) {
    try {
      const { status, message } = await POSTRequest("/v1/auth/signup", {
        email,
        password,
        username: "@" + username,
        display_name,
        pin,
      });

      if (status !== "CREATED") throw new Error(message);
      await getSession();
    } catch (error) {
      toast.error((error as Error).message);
    }
  }

  async function update(updated_data: Partial<User>) {
    try {
      const { data, message, status } = await PATCHRequest<User>(
        "/v1/auth/update",
        updated_data
      );

      if (status !== "OK") {
        toast.error(message);
        return;
      }
      setSession(data);
    } catch (error) {
      throw error;
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
    <AuthContext.Provider
      value={{
        session: { user: session, update },
        logout,
        login,
        signup: { createOTP, submitForm },
      }}
    >
      {session ? (
        children
      ) : pathname.startsWith("/login") || pathname.startsWith("/sign-up") ? (
        children
      ) : (
        <section className="fixed z-50 w-full h-full bg-background grid place-items-center ">
          <div className="relative flex flex-col items-center justify-center gap-2">
            <Image src={croom_logo} alt="logo" className="" />
            <span className="text-6xl font-semibold bg-gradient-to-r from-[#7f00ff] to-[#e100ff] bg-clip-text text-transparent animate-pulse">
              Croom
            </span>
          </div>
        </section>
      )}
    </AuthContext.Provider>
  );
}
