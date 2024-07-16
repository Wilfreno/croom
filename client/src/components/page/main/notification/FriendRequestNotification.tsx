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
import LoadingSvg from "@/components/svg/LoadingSvg";
import { useMemo, useState } from "react";
import useFriendRequestHandler from "@/components/hooks/useFriendRequestHandler";
import { FriendRequest } from "@/lib/types/client-types";

export default function FriendRequestNotification({
  friend_request,
}: {
  friend_request: FriendRequest;
}) {
  const [loading, setLoading] = useState({ accept: false, decline: false });
  const [after_loading, setAfterLoading] = useState({
    accept: false,
    decline: false,
  });

  const { accept, decline } = useFriendRequestHandler();
  const MotionButton = useMemo(() => motion(Button), []);

  return (
    <AnimatePresence>
      {!after_loading.accept && !after_loading.decline ? (
        <Collapsible key={friend_request.sender!.id}>
          <CollapsibleTrigger asChild>
            <li>
              <MotionButton
                initial={{ opacity: 0, x: -100 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
                variant="ghost"
                className="w-full justify-start space-x-5 h-fit p-1"
              >
                <Avatar className="aspect-square w-auto h-10">
                  <AvatarImage
                    src={friend_request!.sender!.profile_photo!.url!}
                    alt={friend_request!
                      .sender!.display_name?.slice(0, 1)
                      .toUpperCase()}
                  />
                  <AvatarFallback>
                    {friend_request!
                      .sender!.display_name?.slice(0, 1)
                      .toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col items-start space-y-1">
                  <p className="font-bold text-sm">
                    {friend_request!.sender!.display_name}
                  </p>
                  <p className="text-xs text-wrap text-start">
                    {friend_request.sender?.display_name} wants to be friends
                    with you
                  </p>
                </div>
              </MotionButton>
            </li>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <motion.div
              key={friend_request.id}
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
                        await accept(friend_request!.sender!!);
                        setLoading((prev) => ({ ...prev, accept: false }));
                        setAfterLoading((prev) => ({ ...prev, accept: true }));
                      }}
                    >
                      {loading.accept ? (
                        <LoadingSvg className="h-6 fill-secondary-foreground" />
                      ) : (
                        <>
                          <CheckIcon className="h-4 text-secondary-foreground" />
                          <p className="text-secondary-foreground ml-3">
                            Accept
                          </p>
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
                        await decline(friend_request?.sender!!);
                        setLoading((prev) => ({ ...prev, decline: false }));
                        setAfterLoading((prev) => ({ ...prev, decline: true }));
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
      ) : null}
      {after_loading.accept && (
        <motion.li
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
          key="accept"
          className="border rounded-lg h-12 p-2 w-full flex items-center justify-center space-x-3 text-xs font-bold"
        >
          <p>Friend request accepted</p>
          <CheckIcon className="h-6 text-secondary-foreground fill-green-600 rounded-full" />
        </motion.li>
      )}
      {after_loading.decline && (
        <motion.li
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
          key="decline"
          className="border rounded-lg h-12 p-2 w-full flex items-center justify-center space-x-3 text-xs font-bold"
        >
          <p>Friend request declined</p>
          <XMarkIcon className="h-6 text-secondary-foreground fill-red-600 rounded-full" />
        </motion.li>
      )}
    </AnimatePresence>
  );
}
