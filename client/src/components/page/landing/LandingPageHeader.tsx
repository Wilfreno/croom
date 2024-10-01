"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { LogOut, Menu, UserRound } from "lucide-react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

export default function LandingPageHeader() {
  const { data, status } = useSession();
  const from = useSearchParams().get("from");

  let search_params = "";

  if (from) search_params += "?from=" + from;

  return (
    <header className="py-3 px-5 md:px-10    flex items-center justify-between">
      <Link href="/">
        <h1 className="text-2xl text-primary font-bold whitespace-nowrap">
          Chat Up
        </h1>
      </Link>

      <div className="hidden md:inline-flex items-center space-x-3">
        <Link href={"/sign-up" + search_params}>
          <Button variant="secondary" size="sm">
            Sign Up
          </Button>
        </Link>
        <Link href={"/login" + search_params}>
          <Button size="lg">Login</Button>
        </Link>
      </div>
      <Sheet>
        <SheetTrigger className="md:hidden">
          <Menu className="h-6 w-auto" />
        </SheetTrigger>
        <SheetContent className="flex flex-col py-20">
          <Link href={"/login" + search_params}>
            <Button size="lg">Login</Button>
          </Link>
          <Link href={"/sign-up" + search_params}>
            <Button variant="secondary" size="sm">
              Sign Up
            </Button>
          </Link>
        </SheetContent>
      </Sheet>
    </header>
  );
}
