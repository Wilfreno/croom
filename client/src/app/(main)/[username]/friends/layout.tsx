"use client";

import AddFriend from "@/components/page/main/AddFriend";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";

export default function Layout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { username: string };
}) {
  const root_path_name = "/" + params.username + "/friends";
  const path_name = usePathname();
  const friends_nav = [
    { name: "Online", link: "/online" },
    { name: "All", link: "/all" },
    { name: "Requests", link: "/requests" },
    { name: "Blocked", link: "/blocked" },
  ];
  return (
    <section className="grow flex flex-col space-y-3">
      <div className="flex items-center justify-between m-5">
        <h1 className="font-bold text-xl ">Friends</h1>
        <nav className=" space-x-1 lg:space-x-5 flex flex-nowrap">
          {friends_nav.map((nav) => (
            <Link
              href={root_path_name + nav.link}
              as={root_path_name + nav.link}
              key={nav.name}
            >
              <Button
                variant={path_name.endsWith(nav.link) ? "secondary" : "outline"}
                className="w-20 text-xs lg:w-24 lg:text-sm"
              >
                {nav.name}
              </Button>
            </Link>
          ))}
        </nav>
        <AddFriend />
      </div>
      {children}
    </section>
  );
}
