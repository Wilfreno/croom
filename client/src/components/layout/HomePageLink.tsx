import Link from "next/link";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip";
import { usePathname, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "../ui/button";
import { HomeIcon } from "@heroicons/react/24/solid";

export default function HomePageLink() {
  const path_name = usePathname();
  const searchParams = useSearchParams();
  const drawer = searchParams.get("drawer");
  const { data } = useSession();

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Link
            href={
              path_name.startsWith("/" + data?.user.user_name)
                ? path_name +
                  "?drawer=" +
                  (drawer === "open" ? "close" : "open")
                : "/" + (data ? data.user.user_name : "")
            }
            as={
              path_name.startsWith("/" + data?.user.user_name)
                ? path_name +
                  "?drawer=" +
                  (drawer === "open" ? "close" : "open")
                : "/" + (data ? data.user.user_name : "")
            }
            prefetch
          >
            <Button
              variant={
                path_name.startsWith("/" + data?.user.user_name)
                  ? "secondary"
                  : "default"
              }
              className="flex aspect-square h-fit p-3  hover:bg-muted group bg-secondary"
            >
              <HomeIcon className="h-5 fill-primary" />
            </Button>
          </Link>
        </TooltipTrigger>
        <TooltipContent className="bg-secondary" side="right" align="start">
          <p className="text-primary">homepage</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
