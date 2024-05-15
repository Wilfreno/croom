export type User = {
  id: string;
  email: string;
  display_name: string;
  user_name: string;
  password?: string;
  profile_pic?: Photo;
  birth_date?: Date;
  messages?: Message[];
  rooms?: Room[];
  provider: string;
  created_at?: Date;
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
