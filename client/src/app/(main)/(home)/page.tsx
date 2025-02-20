"use client";
import { Button } from "@/components/ui/button";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Snail } from "lucide-react";
import { useRouter } from "next/navigation";

export default function Page() {
  const query_client = useQueryClient();
  const router = useRouter();

  const { data: sidebar_open } = useQuery<boolean>({ queryKey: ["home", "sidebar"] });

  return (
    <section className="h-full grow hidden md:grid place-items-center">
      <div className="flex flex-col items-center text-muted-foreground gap-2">
        <Snail className="h-32 w-auto stroke-1 " />
        <div className="flex items-center">
          <Button
            variant={sidebar_open ? "ghost" : "link"}
            className="font-semibold w-fit"
            onClick={() =>
              query_client.setQueryData<boolean>(["home", "sidebar"], (prev) => !prev)
            }
          >
            Select
          </Button>
          <span>or</span>
          <Button
            variant="link"
            className="font-semibold"
            onClick={() => router.push("/compose")}
          >
            Compose
          </Button>
          <span>a conversation</span>
        </div>
      </div>
    </section>
  );
}
