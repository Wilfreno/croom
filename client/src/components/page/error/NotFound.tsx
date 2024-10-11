"use client";
import { Button } from "@/components/ui/button";
import { Snail } from "lucide-react";
import { useRouter } from "next/navigation";
import React from "react";

export default function NotFound({ message }: { message: string }) {
  const router = useRouter();

  return (
    <section className="h-full w-full flex flex-col items-center justify-center text-muted-foreground gap-4 font-bold text-2xl">
      <Snail className="h-20 w-auto stroke-1" />
      {message}
      <Button onClick={() => router.push("/")}>Go back</Button>
    </section>
  );
}