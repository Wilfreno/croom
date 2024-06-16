"use client";
import MainSideBarNavigation from "./MainSideBarNavigation";
import DirectMessages from "./DirectMessages";
import UserMenu from "./UserMenu";
import { cn } from "@/lib/utils";
import { useRouter, useSearchParams } from "next/navigation";

export default function MainLeftSideBar() {
  const searchParams = useSearchParams();
  const drawer = searchParams.get("drawer");
  const router = useRouter();
  return (
    <section
      className={cn(
        "min-w-[18rem] w-[18rem]  h-full flex-col border-r justify-between bg-primary-foreground",
        drawer === "open" && "flex",
        drawer === "close" && "hidden"
      )}
    >
      <MainSideBarNavigation />
      <DirectMessages />
      <UserMenu />
    </section>
  );
}
