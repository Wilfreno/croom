import { Photo, User } from '@repo/schemas';

export interface AuthenticatedUser extends Omit<User, 'password' | 'photo'> {
  id: string;
  photo: Photo
}

export type LoginCredentials = {
  email: string;
  password: string;
};

export type SignUpFormData = {
  email: string;
  password: string;
  confirmPassword: string;
  pin: string;
};
