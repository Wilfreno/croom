"use client";
import { PlusIcon } from "@radix-ui/react-icons";
import { Button } from "../../ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../../ui/tooltip";

import { FormEvent, useState } from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import NewRoomNameAndPhoto from "./NewRoomNameAndPhoto";
import NewRoomType from "./NewRoomType";
import { XMarkIcon } from "@heroicons/react/24/solid";
import { useAppSelector } from "@/lib/redux/store";
import LoadingSvg from "@/components/svg/LoadingSvg";
import useServerUrl from "@/components/hooks/useServerUrl";
import { ServerResponse } from "@/lib/types/sever-response";
import { useToast } from "@/components/ui/use-toast";
import { useRouter } from "next/navigation";
import { Room } from "@/lib/types/client-types";
import { useSession } from "next-auth/react";

export default function CreateNewRoomButton() {
  const [open, setOpen] = useState(false);
  const [component_view, setComponentView] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const new_room = useAppSelector((state) => state.new_room_reducer);
  const server_url = useServerUrl();
  const { toast } = useToast();
  const { data } = useSession();
  const router = useRouter();

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setSubmitting(true);
    const response = await fetch(server_url + "/create/v1/room", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ new_room, creator: { user_id: data?.user.id } }),
    });

    const response_json = (await response.json()) as ServerResponse;

    const room_created = response_json.data as Room;
    if (response_json.status !== "OK") {
      toast({
        title: "Oops! Something went wrong",
        description: response_json.message,
      });
      return;
    }

    setOpen(false);
    router.push("/room/" + room_created.id!);
    router.refresh();
    setSubmitting(false);
  }
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <section className="relative flex w-full justify-center">
            <Button
              variant="outline"
              className="flex h-fit aspect-square p-3 bg-accent"
              onClick={() => setOpen((prev) => !prev)}
            >
              <PlusIcon className="h-5 w-auto aspect-square  " />
            </Button>
            <div
              style={{ background: "rgba(0,0,0,.7)" }}
              className={cn(
                "fixed top-0 left-0 h-screen w-screen grid place-content-center z-10",
                !open && "hidden"
              )}
            >
              <Card className="text-center w-[30rem]">
                {!submitting && (
                  <CardHeader className="relative">
                    <CardTitle>Create New Room</CardTitle>
                    <Button
                      type="button"
                      variant="ghost"
                      className="absolute top-1 right-2 p-1 h-fit"
                      onClick={() => setOpen(false)}
                    >
                      <XMarkIcon className="h-5" />
                    </Button>
                  </CardHeader>
                )}
                <CardContent>
                  {submitting ? (
                    <div>
                      <LoadingSvg className="h-20  fill-secondary-foreground mx-auto my-auto" />
                      <p>Creating your new room</p>
                    </div>
                  ) : (
                    <form onSubmit={handleSubmit}>
                      <NewRoomNameAndPhoto
                        component_view={component_view}
                        setComponentView={setComponentView}
                      />
                      <NewRoomType
                        component_view={component_view}
                        setComponentView={setComponentView}
                      />
                    </form>
                  )}
                </CardContent>
              </Card>
            </div>
          </section>
        </TooltipTrigger>
        <TooltipContent
          className="bg-secondary"
          side="right"
          align="start"
          alignOffset={-5}
        >
          <p className="text-primary">create a room</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
