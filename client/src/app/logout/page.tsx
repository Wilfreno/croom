"use client";

import { signOut } from "next-auth/react";
import { useEffect } from "react";

export default function page() {
  useEffect(() => {
    signOut();
  }, []);
  return null;
}   