"use client";
import useUserAgent from "@/components/hooks/useUserAgent";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { usePathname } from "next/navigation";
import SidebarContent from "../SidebarContent";
import HomeActiveConversations from "../home/HomeActiveConversation";
import HomeConversations from "../home/HomeConversations";
import HomeSideBarMobileHeader from "../home/HomeSideBarMobileHeader";

export default function ConversationSideBar() {
  const { data: open } = useQuery({ queryKey: ["home", "sidebar"], queryFn: () => true });
  const { onMobile: isMobile } = useUserAgent();
  const pathname = usePathname();

  if (isMobile && pathname !== "/") return null;
  return (
    <SidebarContent
      className={cn(
        open
          ? "grid grid-cols-[minmax(0,1fr)] grid-rows-[auto_auto_auto_1fr] gap-4 pt-4 md:grid-rows-[auto_1fr] md:gap-10 md:py-5 w-full shrink-0 md:w-72 lg:w-80 xl:w-[24rem]"
          : "hidden",
        open && pathname !== "/" && "hidden lg:grid",
      )}
    >
      <HomeSideBarMobileHeader />
      <HomeActiveConversations />
      <HomeConversations />
    </SidebarContent>
  );
}
