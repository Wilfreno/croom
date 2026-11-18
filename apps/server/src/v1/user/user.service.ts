import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectConnection } from '@nestjs/mongoose';
import {
  DELETED_USER_DISPLAY_NAME,
  MAX_RECENT_PROFILE_PHOTOS,
} from '@repo/constants';
import {
  AuthServiceOptions,
  CheckUserDataType,
  EmailStatus,
  OTPType,
  PhotoType,
  UserStatus,
} from '@repo/enums';
import {
  ConversationModel,
  PhotoModel,
  SessionModel,
  UserModel,
} from '@repo/models';
import type { Photo } from '@repo/schemas';
import { AuthenticatedUser } from '@repo/types';
import {
  getPasswordStrengthScore,
  isEmail,
  passwordStrengthScorePerCriteriaSatisfied,
} from '@repo/utils';
import { Connection, Types } from 'mongoose';
import { SocketSessionsService } from '../../common/socket-sessions/socket-sessions.service';
import { UploadedFilesService } from '../../common/uploaded-files/uploaded-files.service';
import { OtpService } from '../otp/otp.service';
import { ChangePasswordDto } from './dto/change-password.dto';
import { CheckValueDTO } from './dto/check-value.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { RecoverAccountDto } from './dto/recover-account.dto';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);
  constructor(
    @InjectConnection() private readonly connection: Connection,
    private readonly userModel: UserModel,
    private readonly conversationModel: ConversationModel,
    private readonly otpService: OtpService,
    private readonly photoModel: PhotoModel,
    private readonly sessionModel: SessionModel,
    private readonly configService: ConfigService,
    private readonly socketSessions: SocketSessionsService,
    private readonly uploadedFiles: UploadedFilesService,
  ) {}

  async onApplicationBootstrap() {
    try {
      const renamed = await this.userModel.renameDuplicateUserNames();
      if (renamed > 0)
        this.logger.log(`renamed ${renamed} users with a duplicate username`);

      await this.userModel.createIndexes();
    } catch (error) {
      this.logger.error(error);
    }
  }

  async createUser({
    email,
    password,
    confirmPassword,
    pin,
    authService,
  }: CreateUserDto) {
    if (await this.userModel.getUserExistByEmail(email))
      throw new ConflictException('Email already used');

    switch (authService) {
      case AuthServiceOptions.WITH_EMAIL_AND_PASSWORD: {
        if (!password) throw new BadRequestException('Password is required');
        if (!confirmPassword)
          throw new BadRequestException(
            'Re-enter your password on "Confirm password" field',
          );

        if (password !== confirmPassword)
          throw new BadRequestException(
            'Password and Confirm password is not the same',
          );
        if (
          getPasswordStrengthScore(password) <
          passwordStrengthScorePerCriteriaSatisfied(5)
        )
          throw new BadRequestException('password is weak');

        if (!pin) throw new BadRequestException('OTP is required');

        await this.otpService.verify({ email, pin, type: OTPType.SIGNUP });
        break;
      }
    }

    const session = await this.connection.startSession();

    try {
      return await session.withTransaction(async () => {
        switch (authService) {
          case AuthServiceOptions.WITH_EMAIL_AND_PASSWORD: {
            await this.otpService.consume(
              { email, type: OTPType.SIGNUP },
              session,
            );

            await this.userModel.create(
              {
                email,
                password,
                authService,
              },
              session,
            );

            break;
          }
        }
      });
    } finally {
      await session.endSession();
    }
  }

  async checkAvailability({ type, value }: CheckValueDTO) {
    switch (type) {
      case CheckUserDataType.EMAIL: {
        if (!isEmail(value)) return EmailStatus.INVALID;

        if (await this.userModel.getUserExistByEmail(value))
          return EmailStatus.ALREADY_USED;
        break;
      }
      case CheckUserDataType.USER_NAME: {
        if (await this.userModel.getUserExistByUsername(value))
          return EmailStatus.ALREADY_USED;
        break;
      }
      default: {
        this.logger.error('type must be a value of CheckUserDataType enum');
        throw new BadRequestException();
      }
    }
    return EmailStatus.AVAILABLE;
  }

  async recoverAccount({
    email,
    pin,
    password,
    confirmPassword,
  }: RecoverAccountDto) {
    const emailAvailability = await this.checkAvailability({
      type: CheckUserDataType.EMAIL,
      value: email,
    });

    // email being available indicates no user using the email; ergo, user does not exist
    if (emailAvailability === EmailStatus.AVAILABLE)
      throw new ConflictException('User does not exist');

    if (password !== confirmPassword)
      throw new BadRequestException(
        'password and confirm password must have the same value',
      );

    if (
      getPasswordStrengthScore(password) <
      passwordStrengthScorePerCriteriaSatisfied(5)
    )
      throw new BadRequestException('password is weak');

    await this.otpService.verify({ email, pin, type: OTPType.RECOVER });

    const session = await this.connection.startSession();
    try {
      return await session.withTransaction(async () => {
        await this.otpService.consume({ email, type: OTPType.SIGNUP }, session);

        await this.userModel.updateUser(email, {
          password: await this.userModel.hashPassword(password),
        });
      });
    } finally {
      await session.endSession();
    }
  }

  async searchUser({
    user,
    searchText,
  }: {
    user: AuthenticatedUser;
    searchText: string;
  }) {
    return await this.userModel.searchUser({ userId: user.id, searchText });
  }

  async getUserConversations(userId: string) {
    return await this.conversationModel.getConversationsByUserId(userId);
  }

  async getUserBlockedConversations(userId: string) {
    return await this.conversationModel.getBlockedConversationsByUserId(userId);
  }

  async getUserActiveConversation(userId: string){
    return await this.conversationModel.getActiveConversationByUserId(userId);
  }

  /**
   * Persists the user's presence and returns who should be told about it:
   * everyone who shares at least one conversation with them.
   */
  async updateUserStatus(userId: string, status: UserStatus) {
    const user = await this.userModel.setUserStatus(userId, status);
    if (!user) return null;

    const partnerIds =
      await this.conversationModel.getConversationPartnerIds(userId);

    return {
      status: user.status,
      lastOnline: new Date(user.lastOnline).toISOString(),
      partnerIds,
    };
  }

  async changeDisplayName({
    requesterId,
    displayName,
  }: {
    requesterId: string;
    displayName: string;
  }) {
    await this.userModel.setDisplayName({ userId: requesterId, displayName });

    return { displayName };
  }

  async changeUserName({
    requesterId,
    userName,
  }: {
    requesterId: string;
    userName: string;
  }) {
    const taken = await this.userModel.isUserNameTaken({
      userName,
      exceptUserId: requesterId,
    });
    if (taken) throw new ConflictException('username is already taken');

    await this.userModel.setUserName({ userId: requesterId, userName });

    return { userName };
  }

  async changePassword({
    requesterId,
    sessionToken,
    currentPassword,
    password,
    confirmPassword,
  }: ChangePasswordDto & { requesterId: string; sessionToken?: string }) {
    if (password !== confirmPassword)
      throw new BadRequestException(
        'Password and Confirm password is not the same',
      );

    if (
      getPasswordStrengthScore(password) <
      passwordStrengthScorePerCriteriaSatisfied(5)
    )
      throw new BadRequestException('password is weak');

    const user = await this.userModel.getUserByIdWithPassword(requesterId);
    if (!user) throw new NotFoundException('user does not exist');

    if (user.password) {
      const matched = await this.userModel.verifyPassword({
        password: currentPassword ?? '',
        hashed: user.password,
        configService: this.configService,
      });
      if (!matched)
        throw new UnauthorizedException('current password is incorrect');
    }

    const session = await this.connection.startSession();

    try {
      await session.withTransaction(async () => {
        await this.userModel.setPassword(
          { userId: requesterId, password },
          session,
        );
        await this.sessionModel.revokeAllForUser(
          new Types.ObjectId(requesterId),
          { except: sessionToken, session },
        );
      });
    } finally {
      await session.endSession();
    }

    await this.socketSessions.disconnectUser(requesterId, {
      exceptSessionToken: sessionToken,
    });
  }

  async getProfilePhotos(requesterId: string) {
    return await this.photoModel.getProfilePhotosByOwnerId(requesterId);
  }

  async uploadProfilePhoto({
    requesterId,
    photo,
  }: {
    requesterId: string;
    photo: Pick<Photo, 'key' | 'url'>;
  }) {
    const session = await this.connection.startSession();
    let newPhotoId = '';
    let prunedPhotoKeys: string[] = [];

    try {
      await session.withTransaction(async () => {
        const [newPhoto] = await this.photoModel.createMany(
          [
            {
              owner: new Types.ObjectId(requesterId),
              type: PhotoType.PROFILE,
              key: photo.key,
              url: photo.url,
            },
          ],
          session,
        );
        newPhotoId = String(newPhoto._id);

        await this.userModel.setPhoto(
          { userId: requesterId, photoId: newPhotoId },
          session,
        );
        prunedPhotoKeys = await this.photoModel.deleteProfilePhotosBeyond(
          { ownerId: requesterId, keep: MAX_RECENT_PROFILE_PHOTOS },
          session,
        );
      });
    } finally {
      await session.endSession();
    }

    await this.uploadedFiles.deleteFiles(prunedPhotoKeys);

    return { photo: { id: newPhotoId, url: photo.url } };
  }

  async switchToRecentProfilePhoto({
    requesterId,
    photoId,
  }: {
    requesterId: string;
    photoId: string;
  }) {
    const photo = await this.photoModel.findProfilePhoto({
      photoId,
      ownerId: requesterId,
    });
    if (!photo) throw new NotFoundException('photo does not exist');

    const session = await this.connection.startSession();

    try {
      await session.withTransaction(async () => {
        const stillExists = await this.photoModel.markAsRecent(
          photoId,
          session,
        );
        if (!stillExists) throw new NotFoundException('photo does not exist');

        await this.userModel.setPhoto(
          { userId: requesterId, photoId },
          session,
        );
      });
    } finally {
      await session.endSession();
    }

    return { photo: { id: photoId, url: photo.url } };
  }

  async deleteProfilePhoto({
    requesterId,
    photoId,
  }: {
    requesterId: string;
    photoId: string;
  }) {
    const session = await this.connection.startSession();
    let deletedPhotoKey = '';

    try {
      await session.withTransaction(async () => {
        const notInUse = await this.userModel.touchUnlessUsingPhoto(
          { userId: requesterId, photoId },
          session,
        );
        if (!notInUse)
          throw new ConflictException(
            'you cannot delete the photo you are using',
          );

        const deletedKey = await this.photoModel.deleteProfilePhoto(
          { photoId, ownerId: requesterId },
          session,
        );
        if (deletedKey === null)
          throw new NotFoundException('photo does not exist');

        deletedPhotoKey = deletedKey;
      });
    } finally {
      await session.endSession();
    }

    await this.uploadedFiles.deleteFiles([deletedPhotoKey]);
  }

  async deleteAccount(requesterId: string) {
    const session = await this.connection.startSession();
    let deletedPhotoKeys: string[] = [];

    try {
      await session.withTransaction(async () => {
        await this.userModel.anonymize(
          { userId: requesterId, displayName: DELETED_USER_DISPLAY_NAME },
          session,
        );
        deletedPhotoKeys = await this.photoModel.deleteProfilePhotosByOwnerId(
          requesterId,
          session,
        );
        await this.sessionModel.revokeAllForUser(
          new Types.ObjectId(requesterId),
          { session },
        );
      });
    } finally {
      await session.endSession();
    }

    await this.socketSessions.disconnectUser(requesterId);
    await this.uploadedFiles.deleteFiles(deletedPhotoKeys);
  }
}
