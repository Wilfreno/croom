export type User = {
  id: string;
  email: string;
  password?: string;
  profile_photo: ProfilePhoto;
  birth_date?: Date;
  display_name?: string;
  user_name?: string;
  provider?: string;
  friend_request_sent?: FriendRequest[];
  friend_request_received?: FriendRequest[];
  friends?: Friendship[];
  friends_with?: Friendship[];
  direct_messages_sent?: DirectMessage[];
  direct_messages_received?: DirectMessage[];
  rooms?: Room[];
  room_mesages_sent?: RoomMessage[];
  created_at?: Date;
};

export type ProfilePhoto = {
  id: string;
  owner?: User;
  owner_id?: string;
  photo_url: string;
  created_at?: Date;
};

export type Room = {
  id: string;
  name: string;
  members: User[];
  messages: RoomMessage[];
  created_at: Date;
};

export type DirectMessage = {
  id: string;
  sender: User;
  sender_id: string;
  receiver: User;
  receiver_id: string;
  text_message?: TextMessage;
  photo_message?: PhotoMessage;
  video_message?: VideoMessage;
  created_at: Date;
};

export type RoomMessage = {
  id: string;
  sender: User;
  sender_id: string;
  room: Room;
  room_id: string;
  text_message?: TextMessage;
  photo_message?: PhotoMessage;
  video_Message?: VideoMessage;
  created_at: Date;
};

export type TextMessage = {
  id: string;
  direct_message?: DirectMessage;
  direct_message_id?: string;
  room_message?: RoomMessage;
  room_message_id?: string;
  content: string;
  created_at: Date;
};

export type PhotoMessage = {
  id: string;
  direct_message?: DirectMessage;
  direct_message_id?: string;
  room_message?: RoomMessage;
  room_message_id?: string;
  photo_url: string;
  created_at: Date;
};

export type VideoMessage = {
  id: string;
  direct_message?: DirectMessage;
  direct_message_id?: string;
  room_message?: RoomMessage;
  room_message_id?: string1;
  video_url: string;
  name: string;
  length: number;
  created_at: Date;
};

export type Otp = {
  id: string;
  email: string;
  value: string;
  created_at: Date;
};

export type FriendRequest = {
  id: string;
  receiver: User;
  receiver_id: string;
  sender: User;
  sender_id: string;
  date_created: Date;
};

export type Friendship = {
  id: string;
  friend_1: User;
  friend_1_id: string;
  friend_2: User;
  friend_2_id: string;
  created_at: Date;
};
