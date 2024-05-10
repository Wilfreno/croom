export type User = {
  id: string;
  first_name: string;
  middle_name: string | null;
  last_name: string;
  email: string;
  password?: string;
  room_id: string | null;
  created_at: Date;
};
