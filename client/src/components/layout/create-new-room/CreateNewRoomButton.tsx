"use client";

import { PlusIcon } from "@radix-ui/react-icons";
import { Button } from "../../ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../../ui/tooltip";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import NewRoomNameAndPhoto from "./NewRoomNameAndPhoto";
import NewRoomType from "./NewRoomType";
import { XMarkIcon } from "@heroicons/react/24/solid";

export default function CreateNewRoomButton() {
  const [open, setOpen] = useState(false);
  const [component_view, setComponentView] = useState(0);

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
                <CardContent>
                  <form>
                    <NewRoomNameAndPhoto
                      component_view={component_view}
                      setComponentView={setComponentView}
                    />
                    <NewRoomType
                      component_view={component_view}
                      setComponentView={setComponentView}
                    />
                  </form>
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
