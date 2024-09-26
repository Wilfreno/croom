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
  username: string;
  password?: string;
  email: string;
  status: "OFFLINE" | "ONLINE";
  photo: Photo;
  is_new: boolean;
  lobbies: Lobby[];
  date_created: Date;
  last_updated: Date;
};

export type Photo = {
  id: string;
  owner: User;
  type: "PROFILE" | "LOBBY";
  url: string;
  date_created: Date;
};

export type Lobby = {
  id: string;
  members: User[];
  is_private: boolean;
  name: string;
  messages: Message[];
  photo: Photo;
  date_created: Date;
  last_updated: Date;
};

export type Message = {
  id: string;
  lobby: Lobby;
  type: "TEXT";
  status: "DELETED" | "UPDATED";
  sender: User;
  text: string;
  seen_by: User[];
  date_created: Date;
  last_updated: Date;
};
