"use client";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu } from "lucide-react";
import { useSession } from "next-auth/react";
import Link from "next/link";

export default function Header() {
  const { status } = useSession();
  return (
    <header className="py-3 px-5 md:px-10 shadow-sm flex items-center justify-between">
      <Link href="/">
        <h1 className="text-2xl text-primary font-bold whitespace-nowrap">
          Chat Up
        </h1>
      </Link>

      {status === "unauthenticated" && (
        <>
          <div className="hidden md:inline-flex space-x-3">
            <Button variant="secondary" size="sm">
              Sign Up
            </Button>
            <Button size="lg">Login</Button>
          </div>
          <Sheet>
            <SheetTrigger>
              <Menu className="h-6 w-auto" />
            </SheetTrigger>
            <SheetContent className="flex flex-col py-20">
              <Button size="lg">Login</Button>
              <Button variant="secondary" size="sm">
                Sign Up
              </Button>
            </SheetContent>
          </Sheet>
        </>
      )}
    </header>
  );
}
