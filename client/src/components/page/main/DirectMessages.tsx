import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PencilSquareIcon } from "@heroicons/react/24/solid";
import { useSession } from "next-auth/react";
import Link from "next/link";

export default function DirectMessages() {
  const { data } = useSession();
  return (
    <div className="flex flex-col space-y-5 mx-2">
      <div className="flex items-center justify-between ">
        <p className="font-bold text-sm">Direct messages</p>
        <Button variant="ghost" className="p-1 h-fit" type="button">
          <PencilSquareIcon className="h-4" />
        </Button>
      </div>
      <ScrollArea className="h-[35dvh] my-2">
        <div className="mx-3 space-y-1">
          {Array.from({ length: 30 }).map(() => (
            <Link href={"#"}>
              <Button
                variant="ghost"
                className="w-full justify-start space-x-5 rounded h-fit"
              >
                <Avatar className="aspect-square w-8 h-auto">
                  <AvatarImage
                    src={data?.user.profile_pic?.photo_url}
                    alt={data?.user.display_name.slice(0, 1).toUpperCase()}
                  />
                  <AvatarFallback>
                    {data?.user.display_name.slice(0, 1).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span>{data?.user.display_name}</span>
              </Button>
            </Link>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
