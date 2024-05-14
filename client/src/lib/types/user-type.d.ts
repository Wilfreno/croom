export type User = {
  id?: string;
  display_name: string;
  user_name: string;
  email: string;
  password?: string;
  room_id?: string | null;
  created_at?: Date;
};
