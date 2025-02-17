export type User = {
  id: string;
  username: string;
  display_name: string;
  password?: string;
  email: string;
  status: "OFFLINE" | "ONLINE";
  photo?: Photo;
  conversations: string[];
  last_online: Date;
  date_created: Date;
  last_updated: Date;
};

export type Photo = {
  id: string;
  owner: User;
  type: "PROFILE" | "CHAT_ROOM" | "MESSAGE";
  key: string;
  url: string;
  width: number;
  height: number;
  date_created: Date;
};

export type Conversation = {
  id: string;
  name: string;
  is_group_chat: boolean;
  admins: User[];
  members: User[];
  nicknames: { user: string; value: string }[];
  messages: Message[];
  photo: Photo;
  last_online: Date;
  date_created: Date;
  last_updated: Date;
};

export type Message = {
  id: string;
  conversation: Conversation;
  status: "DELETED" | "UPDATED";
  sender: User;
  text: string;
  photos: Photo[];
  seen_by: User[];
  date_created: Date;
  last_updated: Date;
};

export type Block = {
  id: string;
  blocked_user: User;
  blocker: string;
  conversation: Conversation;
  date_created: Date;
};
