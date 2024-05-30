export type User = {
  id: string;
  email: string;
  display_name: string;
  user_name: string;
  password?: string
  profile_pic?: Photo;
  birth_date?: Date;
  messages?: Message[];
  rooms?: Room[];
  provider: string;
  friend_request_receiver?: FriendRequest[];
  friend_request_sender?: FriendRequest[];
  friends?: Friendship[];
  friends_with?: Friendship[];
  created_at?: Date;
};

export type Room = {
  id: string;
  name: string;
  members: User[];
  messages: Message[];
  created_at: Date;
};

export type Message = {
  id: string;
  owner: User;
  owner_id: string;
  room: Room;
  room_id: string;
  type: string;
  text: string;
  photos: Photo[];
  video: Video;
  created_at: Date;
};

export type Photo = {
  id: string;
  owner?: User;
  owner_id?: string;
  message?: Message;
  message_id?: string;
  photo_url: string;
  created_at?: Date;
};

export type Video = {
  id: string;
  message: Message;
  message_id: string;
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
  created_at: Date;

};

export type Friendship = {
  id: string;
  user_1: User;
  friend_1_id: string;
  user_2: User;
  friend_2_id: string;

  created_at: Date;
};
