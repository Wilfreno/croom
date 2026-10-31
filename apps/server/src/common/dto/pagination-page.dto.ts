import { IsString } from 'class-validator';

export class PaginationPageDTO {
  @IsString()
  page!: string;
}
