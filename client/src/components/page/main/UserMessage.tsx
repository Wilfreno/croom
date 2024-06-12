import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DirectMessage, User } from "@/lib/types/client-types";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { motion } from "framer-motion";

export default function UserMessage({
  user,
  friend,
  message,
  dm_length,
  index,
}: {
  user: User;
  friend: User;
  message: DirectMessage;
  dm_length: number;
  index: number;
}) {
  const [display_date, setDisplayDate] = useState(false);
  return message.sender_id === friend?.id ? (
    <div
      key={message.id}
      className="flex items-start mr-auto space-x-5 max-w-[40vw]"
      onLoad={(e) =>
        index === dm_length - 1 &&
        e.currentTarget.scrollIntoView({
          behavior: "instant",
        })
      }
    >
      <Avatar>
        <AvatarImage
          src={friend?.profile_photo?.photo_url}
          alt={friend?.display_name.slice(0, 1).toUpperCase()}
        />
        <AvatarFallback>
          {friend?.display_name.slice(0, 1).toUpperCase()}
        </AvatarFallback>
      </Avatar>
      <div onClick={() => setDisplayDate((prev) => !prev)}>
        <motion.p
          animate={display_date ? { y: -5 } : { y: 0 }}
          className=" max-w-1/2 p-2 w-fit rounded-lg shadow-md bg-primary cursor-default"
        >
          {message.type === "text" && message.text_message?.content}
        </motion.p>
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
      className="flex items-start ml-auto space-x-3"
      onLoad={(e) =>
        index === dm_length - 1 &&
        e.currentTarget.scrollIntoView({ behavior: "instant" })
      }
    >
      <div
        className="flex flex-col items-end"
        onClick={() => setDisplayDate((prev) => !prev)}
      >
        <motion.p
          animate={display_date ? { y: -5 } : { y: 0 }}
          className={cn(
            "relative max-w-1/2 p-2 rounded-lg shadow-md cursor-default w-fit",
            message.sending ? "bg-primary-foreground" : "bg-primary"
          )}
        >
          {message.type === "text" && message.text_message?.content}
        </motion.p>
        {!!message.sending && (
          <p className="absolute top-full mx-5 text-xs">sending</p>
        )}
        {display_date && (
          <p className="text-xs w-fit whitespace-nowrap">
            {new Date(message.date_created).toLocaleString()}
          </p>
        )}
      </div>
      <Avatar>
        <AvatarImage
          src={user.profile_photo?.photo_url}
          alt={user.display_name.slice(0, 1).toUpperCase()}
        />
        <AvatarFallback>
          {user.display_name.slice(0, 1).toUpperCase()}
        </AvatarFallback>
      </Avatar>
    </div>
  );
}
