import { useAuth } from "@/components/providers/AuthProvider";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Separator } from "@/components/ui/separator";
import { GETRequest } from "@/lib/server/requests";
import { Photo } from "@/lib/types/server-data-types";
import { useQuery } from "@tanstack/react-query";
import Image from "next/image";

export default function SettingsChangePhoto() {
  const { session } = useAuth();

  const { data: recent_photos } = useQuery({
    queryKey: [session.user?.id, "photos"],
    queryFn: async () => {
      try {
        const { data, message, status } = await GETRequest<Photo[]>("/v1/user/photos");

        if (status !== "OK") throw new Error(message);
        return data;
      } catch (error) {
        throw error;
      }
    },
  });

  return (
    <Collapsible>
      <CollapsibleTrigger asChild>
        <Button>Change photo</Button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="grid gap-2 p-2 px-20">
          <p className="font-semibold self-start">Recent photos</p>
          <div className="flex items-center gap-2">
            {recent_photos?.map((photo) => (
              <div key={photo.id} className="aspect-square h-full w-auto">
                <Image src={photo.url} alt={photo.id} width={100} height={100} />
              </div>
            ))}
          </div>
        </div>
        <Separator />
        <div className="flex items-center justify-between p-4 px-20">
          <span className="font-semibold">Upload photo</span>
          <Button variant="outline">Upload</Button>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
