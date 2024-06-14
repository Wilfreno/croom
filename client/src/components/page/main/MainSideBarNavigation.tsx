"use client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  ArchiveBoxIcon,
  BookmarkIcon,
  ChatBubbleOvalLeftEllipsisIcon,
  UserGroupIcon,
} from "@heroicons/react/24/solid";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

export default function MainSideBarNavigation() {
  const { data } = useSession();
  const path_name = usePathname();

  const nav_list = [
    { name: "Notes", link: "/notes", icon: <BookmarkIcon className="h-5" /> },
    {
      name: "Friends",
      link: "/friends",
      icon: <UserGroupIcon className="h-5" />,
    },
    {
      name: "Archive",
      link: "/archive",
      icon: <ArchiveBoxIcon className="h-5" />,
    },
    {
      name: "Requests",
      link: "/requests",
      icon: <ChatBubbleOvalLeftEllipsisIcon className="h-5" />,
    },
  ];

  return (
    <nav className="flex flex-col my-5 space-y-1 mx-1">
      {nav_list.map((item) => (
        <Link href={"/" + data?.user.user_name + item.link} key={item.name}>
          <Button
            variant={
              path_name.startsWith("/" + data?.user.user_name + item.link)
                ? "secondary"
                : "ghost"
            }
            className={cn(
              "w-full justify-between rounded h-10",
              path_name.startsWith("/" + data?.user.user_name + item.link) &&
                "text-primary"
            )}
          >
            <span className="">{item.name}</span>
            <span>{item.icon}</span>
          </Button>
        </Link>
      ))}
    </nav>
  );
}
