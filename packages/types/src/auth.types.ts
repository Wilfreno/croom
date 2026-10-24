import { User } from '@repo/schemas';

export type AuthenticatedUser = Omit<User, 'password'> & { id: string };
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
