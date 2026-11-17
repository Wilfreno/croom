import { IsMongoId } from 'class-validator';

export class AddMemberParamDto {
  @IsMongoId()
  conversationId!: string;
}

export class AddMemberDto {
  @IsMongoId()
  memberId!: string;
}

export class RemoveMemberParamDto {
  @IsMongoId()
  conversationId!: string;

  @IsMongoId()
  memberId!: string;
}
