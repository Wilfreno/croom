"use client";

import { POSTRequest } from "@/lib/server/requests";
import { useSession } from "next-auth/react";
import React, { useEffect } from "react";

export default function CreateServerSession({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data } = useSession();

  useEffect(() => {
    if (!data) return;

    async function setSession() {
      await POSTRequest("/v1/user/session", { id: data?.user.id });
    }

    setSession();
  }, [data]);
  return children;
}
