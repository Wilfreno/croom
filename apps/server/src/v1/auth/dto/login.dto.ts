import type { LoginCredentials } from '@repo/types';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class LoginDto implements LoginCredentials {
  @IsEmail()
  email!: string;

  /**
   * Deliberately has no length or strength rule. Those belong at signup, where
   * they describe what may be chosen; repeating them here would reject a
   * password the account legitimately has and tell the caller what the policy
   * is before they have proved anything.
   */
  @IsString()
  @IsNotEmpty()
  password!: string;
}
