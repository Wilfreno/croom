export type User = {
  id: string;
  email: string;
  password?: string;
  profile_photo?: ProfilePhoto;
  notifications?: Notification[];
  birth_date?: Date;
  display_name: string;
  user_name: string;

  friend_request_sent?: FriendRequest[];
  friend_request_received?: FriendRequest[];
  friends?: Friendship[];
  friends_with?: Friendship[];

  direct_conversations?: DirectConversation[];
  direct_conversations_?: DirectConversation[];
  direct_messages_sent?: DirectMessage[];
  direct_messages_received?: DirectMessage[];

  room_membership?: RoomMember[];
  lounge_message?: LoungeMessage[];
  session_message?: SessionMessage[];

  date_created?: Date;
};

export type Notification = {
  id: string;
  owner?: User;
  type?: NotificationType;
  friend_request?: FriendRequest;
  friend_request_id?: string;
  room_invite?: RoomInvite;
  room_invite_id?: string;
};

type NotificationType = "FRIEND_REQUEST" | "ROOM_INVITE";

export type ProfilePhoto = {
  id: string;
  owner?: User;
  owner_id: string;
  url: string;
  date_created?: Date;
};

export type FriendRequest = {
  id: string;
  receiver?: User;
  receiver_id: string;
  sender?: User;
  sender_id: string;
  notification?: Notification;
  date_created?: Date;
};

export type Friendship = {
  id: string;
  user_1?: User;
  user_1_id: string;
  user_2?: User;
  user_2_id: string;
  date_created?: Date;
};

export type DirectConversation = {
  id: string;
  user1?: User;
  user1_id: string;
  user2?: User;
  user2_id: string;
  messages?: DirectMessage[];
  date_created?: Date;
};

export type DirectMessage = {
  id: string;
  conversation?: DirectConversation;
  conversation_id: string;
  sender?: User;
  sender_id: string;
  receiver?: User;
  receiver_id: string;
  type?: MessageType;
  seen: boolean;
  text_message?: TextMessage;
  photo_message?: PhotoMessage;
  video_message?: VideoMessage;
  date_created?: Date;
};

type MessageType = "TEXT" | "PHOTO" | "VIDEO";

export type Room = {
  id: string;
  photo?: RoomPhoto;
  name: string;
  type?: RoomType;
  invite?: RoomInvite;
  members?: RoomMember[];
  lounge?: Lounge;
  sessions?: Session[];
  date_created?: Date;
};

type RoomType = "PUBLIC" | "PRIVATE";

export type RoomInvite = {
  id: string;
  room?: Room;
  room_id: string;
  code: string;
  notification?: Notification;
  last_updated?: Date;
  date_created?: Date;
};

export type RoomPhoto = {
  id: string;
  room?: Room;
  room_id?: string;
  url: string;
  height: Int;
  width: Int;
  date_created?: Date;
};

export type RoomMember = {
  id: string;
  user?: User;
  room?: Room;
  room_id: string;
  role?: Role;
  date_created?: Date;
};

type Role = "MEMBER" | "MODERATOR";

export type Lounge = {
  id: string;
  room?: Room;
  messages?: LoungeMessage[];
  date_created?: Date;
};

export type LoungeMessage = {
  id: string;
  type?: MessageType;
  lounge?: Lounge;
  lounge_id: string;
  sender?: User;
  sender_id: string;
  text_message?: TextMessage;
  photo_message?: PhotoMessage;
  video_message?: VideoMessage;
  date_created?: Date;
};

//Session refers to room sessions
export type Session = {
  id: string;
  room?: Room;
  room_id: string;
  name: string;
  messages?: SessionMessage[];
  date_created?: Date;
};

export type SessionMessage = {
  id: string;
  type?: MessageType;
  session?: Session;
  session_id: string;
  sender?: User;
  sender_id: string;

  text_message?: TextMessage;
  photo_message?: PhotoMessage;
  video_message?: VideoMessage;
  date_created?: Date;
};

export type TextMessage = {
  id: string;
  direct_message?: DirectMessage;
  direct_message_id?: string;
  lounge_message?: LoungeMessage;
  lounge_message_id?: string;
  session_message?: SessionMessage;
  session_message_id?: string;
  content: string;
  date_created?: Date;
};

export type PhotoMessage = {
  id: string;
  direct_message?: DirectMessage;
  direct_message_id: string;
  lounge_message?: LoungeMessage;
  lounge_message_id: string;
  session_message?: SessionMessage;
  session_message_id: string;
  url: string;
  date_created?: Date;
};

export type VideoMessage = {
  id: string;
  direct_message?: DirectMessage;
  direct_message_id: string;
  lounge_message?: LoungeMessage;
  lounge_message_id: string;
  session_message?: SessionMessage;
  session_message_id: string;
  url: string;
  name: string;
  length: Int;
  date_created?: Date;
};

export type Otp = {
  id: string;
  email: string;
  value: string;
  date_created?: Date;
};

//client side only entity
export type Friend = {
  id: string;
  user_name: string;
  display_name: string;
  profile_photo: {
    url: string;
  };
  friends_since: Date;
};
