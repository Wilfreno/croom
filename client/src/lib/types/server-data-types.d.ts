export type User = {
  id: string;
  display_name: string;
  username: string;
  password?: string;
  email: string;
  status: "OFFLINE" | "ONLINE";
  photo: Photo;
  chat_rooms: ChatRoom[];
  date_created: Date;
  last_updated: Date;
};

export type Photo = {
  id: string;
  owner: User;
  type: "PROFILE" | "CHAT_ROOM" | "MESSAGE";
  url: string;
  date_created: Date;
};

export type Conversation = {
  id: string;
  name: string;
  is_private: boolean;
  is_group_chat: boolean;
  members: Member[];
  messages: Message[];
  photo: Types.ObjectId;
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
