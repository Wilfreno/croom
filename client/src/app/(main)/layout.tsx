import LayoutSideBar from "@/components/layout/LayoutSideBar";
import NewUser from "@/components/page/new-user/NewUser";
import { Dialog } from "@/components/ui/dialog";
import auth_options from "@/lib/auth-options";
import { getServerSession } from "next-auth";
import React from "react";

export default function layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <NewUser />
      <LayoutSideBar />
      {children}
    </>
  );
}
