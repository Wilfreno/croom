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
import { AppDispatch, useAppSelector } from "@/lib/redux/store";
import LoadingSvg from "@/components/svg/LoadingSvg";
import { useRouter } from "next/navigation";
import { Room } from "@/lib/types/client-types";
import { useSession } from "next-auth/react";
import { useDispatch } from "react-redux";
import { setCreatedRoom } from "@/lib/redux/slices/created-room-slice";
import useHTTPRequest from "@/components/hooks/useHTTPRequest";

export default function CreateNewRoomButton() {
  const [open, setOpen] = useState(false);
  const [component_view, setComponentView] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const new_room = useAppSelector((state) => state.new_room);
  const { data } = useSession();
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const http_request = useHTTPRequest();

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setSubmitting(true);

    const room_created = (await http_request.POST("/v1/room", {
      new_room,
      creator: { user_id: data?.user.id },
    })) as Room;

    setOpen(false);
    router.push("/room/" + room_created.id! + "/lounge");
    dispatch(setCreatedRoom(room_created));
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
