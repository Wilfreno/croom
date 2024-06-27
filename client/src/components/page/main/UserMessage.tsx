import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DirectMessage, User } from "@/lib/types/client-types";
import { cn } from "@/lib/utils";
import { Dispatch, SetStateAction, useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { EllipsisHorizontalIcon, TrashIcon } from "@heroicons/react/24/solid";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ServerResponse } from "@/lib/types/sever-response";
import { useToast } from "@/components/ui/use-toast";
import useHTTPRequest from "@/components/hooks/useHTTPRequest";

export default function UserMessage({
  user,
  friend,
  message,
  dm_length,
  index,
  setDirectMessages,
}: {
  user: User;
  friend: User;
  message: DirectMessage;
  dm_length: number;
  index: number;
  setDirectMessages: Dispatch<SetStateAction<DirectMessage[]>>;
}) {
  const [display_date, setDisplayDate] = useState(false);
  const [display_option, setDisplayOption] = useState(false);

  const { toast } = useToast();
  const http_request = useHTTPRequest();

  async function deleteMessage() {
    try {
      await http_request.DELETE("/v1/direct-conversation/message", {
        message_id: message.id,
      });
      setDirectMessages((prev) => prev.toSpliced(index, 1));
    } catch (error) {
      throw error;
    }
  }
  return message.sender_id === friend?.id ? (
    <div
      key={message.id}
      className="flex items-end mr-auto space-x-5 max-w-[40vw]"
      onLoad={(e) =>
        index === dm_length - 1 &&
        e.currentTarget.scrollIntoView({
          behavior: "instant",
        })
      }
    >
      <Avatar>
        <AvatarImage
          src={friend?.profile_photo?.url}
          alt={friend?.display_name.slice(0, 1).toUpperCase()}
        />
        <AvatarFallback>
          {friend?.display_name.slice(0, 1).toUpperCase()}
        </AvatarFallback>
      </Avatar>
      <div>
        <motion.div
          animate={display_date ? { y: -5 } : { y: 0 }}
          className="max-w-[30vw] p-2 rounded-lg shadow-md cursor-default  bg-primary text-sm text-wrap whitespace-pre-line"
        >
          <p
            onClick={() => setDisplayDate((prev) => !prev)}
            className="break-all"
          >
            {message.type === "TEXT" && message.text_message?.content}
          </p>
        </motion.div>
        {display_date && (
          <p className="text-xs w-fit whitespace-nowrap">
            {new Date(message.date_created).toLocaleString()}
          </p>
        )}
      </div>
    </div>
  ) : (
    <div
      key={message.id}
      className="flex items-end  ml-auto space-x-3"
      onLoad={(e) =>
        index === dm_length - 1 &&
        e.currentTarget.scrollIntoView({ behavior: "instant" })
      }
    >
      <div className="flex flex-col items-end group ">
        <div className="flex items-center space-x-1">
          <DropdownMenu onOpenChange={(open) => open && setDisplayOption(open)}>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className={cn(
                  "hidden aspect-square p-1 h-fit group-hover:inline-flex hover:bg-primary-foreground mx-1 focus-visible:ring-0",
                  display_option && "inline-flex"
                )}
              >
                <EllipsisHorizontalIcon className="h-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="left">
              <DropdownMenuItem
                className="cursor-pointer"
                onClick={deleteMessage}
              >
                delete
                <TrashIcon className="h-4 fill-red-600 mx-1" />
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <motion.div
            animate={display_date ? { y: -5 } : { y: 0 }}
            className="max-w-[30vw] p-2 rounded-lg shadow-md cursor-default  bg-primary text-sm text-wrap whitespace-pre-line"
          >
            <p
              onClick={() => setDisplayDate((prev) => !prev)}
              className="break-all"
            >
              {message.type === "TEXT" && message.text_message?.content}
            </p>
          </motion.div>
        </div>
        {display_date && (
          <p className="text-xs w-fit whitespace-nowrap mx-5 my-1">
            {new Date(message.date_created).toLocaleString()}
          </p>
        )}
      </div>
      <Avatar>
        <AvatarImage
          src={user.profile_photo?.url}
          alt={user.display_name.slice(0, 1).toUpperCase()}
        />
        <AvatarFallback>
          {user.display_name.slice(0, 1).toUpperCase()}
        </AvatarFallback>
      </Avatar>
    </div>
  );
}
