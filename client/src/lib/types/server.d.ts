export type ServerResponse<T = null> = {
  status:
    | "OK"
    | "UNAUTHORIZED"
    | "NOT_FOUND"
    | "INTERNAL_SERVER_ERROR"
    | "CONFLICT"
    | "FORBIDDEN"
    | "BAD_REQUEST"
    | "CREATED"
    | "OUT_OF_BOUND";

  message: string;
  data: T;
};

export type User = {
  id: string;
  display_name: string;
  is_new: boolean;
  username: string;
  password?: string;
  status: "OFFLINE" | "ONLINE";
  photo: Photo;
  date_created: Date;
  last_updated: Date;
};

export type Photo = {
  id: string;

  owner: User;
  type: "PROFILE";
  url: string;
  date_created: Date;
};

export type Chat = {
  id: string;
  participants: User[];
  name: string;
  is_group_chat: boolean;
  messages: Message[];
  date_created: Date;
};

export type Message = {
  chat: Chat;
  type: "text";
  sender: User;
  text: string;
  seen_by: User[];
  date_created: Date;
  last_updated: Date;
};
