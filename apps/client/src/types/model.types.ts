import { User as UserType, Conversation as ConversationType,  Photo } from '@repo/schemas';


export interface User extends UserType {

}


export interface Conversation extends Omit<ConversationType, 'members' | 'photo'> {
  _id: string;
  members: User
  photo: Photo | null;
}
