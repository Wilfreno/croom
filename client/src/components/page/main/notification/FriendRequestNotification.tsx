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
import LoadingSvg from "@/components/svg/LoadingSvg";
import { FriendRequest } from "@/lib/types/user-type";
import { useState } from "react";

export default function FriendRequestNotification({
  notification,
  accept,
  decline,
  index,
}: {
  notification: NotificationType;
  accept: (request: FriendRequest, index: number) => Promise<void>;
  decline: (request: FriendRequest, index: number) => Promise<void>;
  index: number;
}) {
  const [loading, setLoading] = useState({ accept: false, decline: false });
  const [after_loading, setAfterLoading] = useState({
    accept: false,
    decline: false,
  });
  const MotionButton = motion(Button);

  return (
    <AnimatePresence mode="popLayout">
      <Collapsible>
        <CollapsibleTrigger asChild>
          <li>
            <MotionButton
              key={notification.content!.id}
              initial={{ opacity: 0, x: -100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -100 }}
              transition={{ duration: 1 }}
              variant="ghost"
              className="w-full justify-start space-x-5 h-fit"
            >
              <Avatar>
                <AvatarImage
                  src={notification.content!.sender.profile_pic!.photo_url!}
                  alt={notification
                    .content!.sender.display_name.slice(0, 1)
                    .toUpperCase()}
                />
                <AvatarFallback>
                  {notification
                    .content!.sender.display_name.slice(0, 1)
                    .toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col items-start space-y-1">
                <p className="font-bold">
                  {notification.content!.sender.display_name}
                </p>
                <p className="text-xs text-wrap text-start">
                  {notification.message}
                </p>
              </div>
            </MotionButton>
          </li>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <motion.div
            key={notification.message}
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
                    onClick={async () => {
                      setLoading((prev) => ({ ...prev, accept: true }));
                      await accept(
                        notification.content as FriendRequest,
                        index
                      );
                      setLoading((prev) => ({ ...prev, accept: false }));
                    }}
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
                    onClick={async () => {
                      setLoading((prev) => ({ ...prev, decline: true }));
                      await decline(
                        notification.content as FriendRequest,
                        index
                      );
                      setLoading((prev) => ({ ...prev, decline: false }));
                    }}
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
