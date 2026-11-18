import {
  USER_NAME_MAX_LENGTH,
  USER_NAME_MIN_LENGTH,
  USER_NAME_PATTERN,
} from '@repo/constants';
import { Transform } from 'class-transformer';
import { IsString, Length, Matches } from 'class-validator';

export class ChangeUserNameDto {
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().replace(/^@/, '') : value,
  )
  @IsString()
  @Length(USER_NAME_MIN_LENGTH, USER_NAME_MAX_LENGTH)
  @Matches(USER_NAME_PATTERN, {
    message: 'username can only have letters, numbers, dots and underscores',
  })
  userName!: string;
}
