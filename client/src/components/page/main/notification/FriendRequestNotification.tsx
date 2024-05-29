import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { CheckIcon, XMarkIcon } from "@heroicons/react/24/solid";
import { AnimatePresence, motion } from "framer-motion";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { NotificationType } from "@/lib/types/notification-type";
import { useSession } from "next-auth/react";
import { ServerResponse } from "@/lib/types/sever-response";
import { Dispatch, SetStateAction, useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { useRouter } from "next/navigation";
import LoadingSvg from "@/components/svg/LoadingSvg";

export default function FriendRequestNotification({
  notification,
  notifications,
  setNotifications,
  index,
}: {
  notification: NotificationType;
  notifications: NotificationType[];
  setNotifications: Dispatch<SetStateAction<NotificationType[]>>;
  index: number;
}) {
  const server_url = process.env.NEXT_PUBLIC_DEVELOPMENT_SERVER!;
  if (!server_url)
    throw new Error(
      "NEXT_PUBLIC_DEVELOPMENT_SERVER is missing from your .env.local file"
    );
  const { data } = useSession();
  const { toast } = useToast();
  const router = useRouter();
  const [loading, setLoading] = useState({ accept: false, decline: false });
  const [accepted, setAccepted] = useState(false);

  async function accept() {
    setLoading((prev) => ({ ...prev, accept: true }));
    const response = await fetch(server_url + "/accept/friend-request", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        sender: notification.content.sender.id,
        receiver: data?.user.id,
      }),
    });
    const response_json = (await response.json()) as ServerResponse;

    if (response_json.status === "OK") {
      setAccepted(true);
    } else {
      toast({
        title: "Something went wrong!",
        description: response_json.message,
      });
    }
    setNotifications((prev) => prev.toSpliced(index, 1));
    setLoading((prev) => ({ ...prev, accept: false }));
    router.refresh();
  }

  async function decline() {
    setLoading((prev) => ({ ...prev, decline: true }));
    const response = await fetch(server_url + "/decline/friend-request", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        sender: notification.content.sender.id,
        receiver: data?.user.id,
      }),
    });
    const response_json = (await response.json()) as ServerResponse;

    if (response_json.status !== "OK") {
      toast({
        title: "Something went wrong!",
        description: response_json.message,
      });
    }

    setNotifications((prev) => prev.toSpliced(index, 1));
    setLoading((prev) => ({ ...prev, decline: false }));
    router.refresh();
  }

  const MotionButton = motion(Button);
  return (
    <AnimatePresence>
      <Collapsible>
        <CollapsibleTrigger asChild>
          <li>
            <MotionButton
              key={notification.content.sender.id}
              exit={{ opacity: 0, x: -50, transition: { duration: 0.3 } }}
              variant="ghost"
              className="w-full justify-start space-x-5 h-fit"
            >
              <Avatar>
                <AvatarImage
                  src={notification.content.sender.profile_pic!.photo_url!}
                  alt={notification.content.sender.display_name
                    .slice(0, 1)
                    .toUpperCase()}
                />
                <AvatarFallback>
                  {notification.content.sender.display_name
                    .slice(0, 1)
                    .toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col items-start space-y-1">
                <p className="font-bold">
                  {notification.content.sender.display_name}
                </p>
                <p className="text-xs text-wrap text-start">
                  {notification.content.message}
                </p>
              </div>
            </MotionButton>
          </li>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <motion.div
            key={notification.content.message}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="flex items-center w-full justify-evenly p-2"
          >
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    className="h-fit w-auto p-2 bg-green-600 "
                    onClick={accept}
                  >
                    {loading.accept ? (
                      <LoadingSvg className="h-6 fill-secondary-foreground" />
                    ) : (
                      <>
                        <CheckIcon className="h-4 text-secondary-foreground" />
                        <p className="text-secondary-foreground ml-3">Accept</p>
                      </>
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Accept friend request</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    className="h-fit w-auto p-2 bg-red-600"
                    onClick={decline}
                  >
                    {loading.decline ? (
                      <LoadingSvg className="h-6 fill-secondary-foreground" />
                    ) : (
                      <>
                        <XMarkIcon className="h-4 text-secondary-foreground " />
                        <p className="text-secondary-foreground ml-3">
                          Decline
                        </p>
                      </>
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Decline friend request</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </motion.div>
        </CollapsibleContent>
      </Collapsible>
    </AnimatePresence>
  );
}
