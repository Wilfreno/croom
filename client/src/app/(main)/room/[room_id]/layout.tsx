import Lounge from "@/components/page/room/Lounge";
import RoomSessions from "@/components/page/room/RoomSessions";
import RoomSideBar from "@/components/page/room/RoomLeftSideBar";
import { Separator } from "@/components/ui/separator";
import AddRoomMember from "@/components/page/room/AddRoomMember";

export default function page({ children }: { children: React.ReactNode }) {
  return (
    <main className="grow flex">
      <section className="min-w-[18rem] w-[18rem]  h-full flex flex-col border-r items-center bg-primary-foreground  py-2">
        <RoomSideBar />
        <AddRoomMember />
        <Separator className=" mb-3" />
        <Lounge />
        <Separator className="mt-8 mb-3" />
        <RoomSessions />
      </section>

      {children}
      <section className="min-w-[18rem] w-[18rem]  h-full flex-col border-r justify-between bg-primary-foreground  py-2"></section>
    </main>
  );
}
