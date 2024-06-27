"use client";

import { usePathname, useRouter} from "next/navigation";
import { Separator } from "../ui/separator";
import { useEffect } from "react";
import HomePageLink from "./HomePageLink";
import DiscoverPageLink from "./DiscoverPageLink";
import CreateNewRoomButton from "./create-new-room/CreateNewRoomButton";
import Rooms from "./Rooms";

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
      <div className="space-y-3 flex flex-col items-center ">
        <Rooms />
        <DiscoverPageLink />
        <CreateNewRoomButton />
      </div>
    </section>
  );
}
