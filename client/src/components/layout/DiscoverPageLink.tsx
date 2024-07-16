import React from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";
import Link from "next/link";
import { Button } from "../ui/button";
import CompassSvg from "../svg/CompassSvg";
import { usePathname, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";

export default function DiscoverPageLink() {
  const path_name = usePathname();
  const searchParams = useSearchParams();
  const drawer = searchParams.get("drawer");
  const { data } = useSession();

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Link href="/discover" as="/discover" prefetch>
            <Button
              disabled={path_name.startsWith("/discover")}
              variant={
                path_name.startsWith("/discover") ? "secondary" : "ghost"
              }
              className="flex aspect-square h-fit p-3 hover:bg-accent"
            >
              <CompassSvg className="h-5 fill-primary" />
            </Button>
          </Link>
        </TooltipTrigger>
        <TooltipContent
          className="bg-secondary"
          side="right"
          align="start"
          alignOffset={-5}
        >
          <p className="text-primary">discover</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
