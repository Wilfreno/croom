import { IsMongoId } from 'class-validator';

export class AddAdminParamDto {
  @IsMongoId()
  conversationId!: string;
}

export class AddAdminDto {
  @IsMongoId()
  memberId!: string;
}

export class RemoveAdminParamDto {
  @IsMongoId()
  conversationId!: string;

  @IsMongoId()
  memberId!: string;
}
