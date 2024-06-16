"use client";

import Link from "next/link";
import { PlusIcon, HomeIcon } from "@heroicons/react/24/solid";
import { Button } from "../ui/button";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { Separator } from "../ui/separator";
import { ThemeToggler } from "../dark-mode/ThemeToggler";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";
import CompassSvg from "../svg/CompassSvg";
import { useEffect } from "react";
import HomePageLink from "./HomePageLink";
import DiscoverPageLink from "./DiscoverPageLink";
import CreateNewRoomButton from "./CreateNewRoomButton";

export default function LayoutSideBar() {
  const path_name = usePathname();
  const router = useRouter();

  useEffect(() => {
    router.replace(path_name + "?drawer=open");
  }, []);

  return (
    <section className="h-full w-fit px-2 py-2 space-y-3">
      <nav className="h-fit w-fit flex flex-col space-y-3">
        <HomePageLink />
        <Separator className="h-1 w-4/5 bg-secondary rounded-full mx-auto" />
      </nav>
      <div className="space-y-3 flex flex-col items-center">
        <div
          className="overflow-y-auto max-h-[27rem] scroll-m-0 scroll-p-0 w-full"
          style={{
            msOverflowStyle: "none",
            scrollbarWidth: "none",
          }}
        >
          <div className="space-y-2 w-full"></div>
        </div>
        <DiscoverPageLink />
        <CreateNewRoomButton />
      </div>
    </section>
  );
}
