import { REPORT_REASON_MAX_LENGTH } from '@repo/constants';
import { Transform } from 'class-transformer';
import { IsMongoId, IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class ReportUserDto {
  @IsMongoId()
  conversationId!: string;

  @IsMongoId()
  user!: string;

  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @IsNotEmpty()
  @MaxLength(REPORT_REASON_MAX_LENGTH)
  reason!: string;
}
