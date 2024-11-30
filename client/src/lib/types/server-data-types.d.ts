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

export type ChatRoom = {
  id: string;
  is_private: boolean;
  members: Member[];
  name: string;
  messages: Message[];
  photo: Photo;
  date_created: Date;
  last_updated: Date;
};
