export type User = {
  id: string;
  username: string;
  display_name: string;
  password?: string;
  email: string;
  status: "OFFLINE" | "ONLINE";
  photo?: Photo;
<<<<<<< HEAD
  conversations: string[];
  blocked: string[];
=======
  chat_rooms: ChatRoom[];
>>>>>>> 48594df86b677d2b1222ce8220c48d5ef0822e60
  last_online: Date;
  date_created: Date;
  last_updated: Date;
};

export type Photo = {
  id: string;
  owner: User;
  type: "PROFILE" | "CHAT_ROOM" | "MESSAGE";
  url: string;
  width: number;
  height: number;
  date_created: Date;
};

export type Conversation = {
  id: string;
  name: string;
  is_private: boolean;
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
