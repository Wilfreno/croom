import { CheckUserDataType } from '@repo/enums';
import { IsEnum, IsString } from 'class-validator';
export class CheckValueDTO {
  @IsEnum(CheckUserDataType)
  type!: string;

  @IsString()
  value!: string;
}
