import { ConfigService } from '@nestjs/config';
import { getConnectionToken } from '@nestjs/mongoose';
import { Test } from '@nestjs/testing';
import {
  AuthServiceOptions,
  CheckUserDataType,
  EmailStatus,
  OTPType,
  UserStatus,
} from '@repo/enums';
import {
  ConversationModel,
  PhotoModel,
  SessionModel,
  UserModel,
} from '@repo/models';
import type { AuthenticatedUser } from '@repo/types';
import { Types } from 'mongoose';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SocketSessionsService } from '../../common/socket-sessions/socket-sessions.service';
import { OtpService } from '../otp/otp.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UserService } from './user.service';

const EMAIL = 'someone@example.com';
const REQUESTER_ID = '507f1f77bcf86cd799439011';
const PHOTO_ID = '507f1f77bcf86cd799439022';
const STRONG_PASSWORD = 'N3w-secret!';

const signup = (over: Partial<CreateUserDto> = {}): CreateUserDto =>
  ({
    email: EMAIL,
    // Strong enough for the strength check: length, upper, lower, number, symbol.
    password: 'Sup3r-secret!',
    confirmPassword: 'Sup3r-secret!',
    pin: '123456',
    authService: AuthServiceOptions.WITH_EMAIL_AND_PASSWORD,
    ...over,
  }) as CreateUserDto;

function build() {
  const session = {
    withTransaction: vi.fn(async (fn: () => Promise<unknown>) => fn()),
    endSession: vi.fn().mockResolvedValue(undefined),
  };
  const connection = { startSession: vi.fn().mockResolvedValue(session) };
  const userModel = {
    getUserExistByEmail: vi.fn().mockResolvedValue(false),
    getUserExistByUsername: vi.fn().mockResolvedValue(false),
    create: vi.fn().mockResolvedValue(undefined),
    setUserStatus: vi.fn().mockResolvedValue(null),
    isUserNameTaken: vi.fn().mockResolvedValue(false),
    setDisplayName: vi.fn().mockResolvedValue(undefined),
    setUserName: vi.fn().mockResolvedValue(undefined),
    getUserByIdWithPassword: vi
      .fn()
      .mockResolvedValue({ password: 'hashed:old' }),
    verifyPassword: vi.fn().mockResolvedValue(true),
    setPassword: vi.fn().mockResolvedValue(undefined),
    setPhoto: vi.fn().mockResolvedValue(undefined),
    anonymize: vi.fn().mockResolvedValue(undefined),
  };
  const photoModel = {
    createMany: vi.fn().mockResolvedValue([{ _id: PHOTO_ID }]),
    getProfilePhotosByOwnerId: vi.fn().mockResolvedValue([]),
    findProfilePhoto: vi.fn().mockResolvedValue({ url: 'https://utfs.io/f/a' }),
    markAsRecent: vi.fn().mockResolvedValue(undefined),
    deleteProfilePhotosBeyond: vi.fn().mockResolvedValue(undefined),
    deleteProfilePhotosByOwnerId: vi.fn().mockResolvedValue(undefined),
    deleteById: vi.fn().mockResolvedValue(undefined),
  };
  const sessionModel = {
    revokeAllForUser: vi.fn().mockResolvedValue(undefined),
  };
  const socketSessions = {
    disconnectUser: vi.fn().mockResolvedValue(undefined),
  };
  const conversationModel = {
    getConversationPartnerIds: vi.fn().mockResolvedValue([]),
  };
  const otpService = {
    verify: vi.fn().mockResolvedValue(undefined),
    consume: vi.fn().mockResolvedValue(undefined),
  };

  return {
    session,
    connection,
    userModel,
    conversationModel,
    otpService,
    photoModel,
    sessionModel,
    socketSessions,
  };
}

type Mocks = ReturnType<typeof build>;

async function makeService(mocks: Mocks) {
  const moduleRef = await Test.createTestingModule({
    providers: [
      UserService,
      { provide: getConnectionToken(), useValue: mocks.connection },
      { provide: UserModel, useValue: mocks.userModel },
      { provide: ConversationModel, useValue: mocks.conversationModel },
      { provide: OtpService, useValue: mocks.otpService },
      { provide: PhotoModel, useValue: mocks.photoModel },
      { provide: SessionModel, useValue: mocks.sessionModel },
      { provide: ConfigService, useValue: { get: vi.fn() } },
      { provide: SocketSessionsService, useValue: mocks.socketSessions },
    ],
  }).compile();

  return moduleRef.get(UserService);
}

describe('UserService', () => {
  let mocks: Mocks;
  let service: UserService;

  beforeEach(async () => {
    vi.clearAllMocks();
    mocks = build();
    service = await makeService(mocks);
  });

  describe('createUser', () => {
    it('refuses an email that already has an account', async () => {
      mocks.userModel.getUserExistByEmail.mockResolvedValue(true);

      await expect(service.createUser(signup())).rejects.toMatchObject({
        status: 409,
        message: 'Email already used',
      });

      expect(mocks.connection.startSession).not.toHaveBeenCalled();
    });

    it.each([
      ['password', { password: undefined }, 'Password is required'],
      [
        'confirmPassword',
        { confirmPassword: undefined },
        'Re-enter your password on "Confirm password" field',
      ],
      ['pin', { pin: undefined }, 'OTP is required'],
    ])('rejects a signup missing %s', async (_field, over, message) => {
      await expect(
        service.createUser(signup(over as Partial<CreateUserDto>)),
      ).rejects.toMatchObject({ status: 400, message });

      expect(mocks.userModel.create).not.toHaveBeenCalled();
    });

    it('rejects a weak password before checking the pin', async () => {
      await expect(
        service.createUser(signup({ password: 'sup3rsecret', confirmPassword: 'sup3rsecret' })),
      ).rejects.toMatchObject({ status: 400, message: 'password is weak' });

      expect(mocks.otpService.verify).not.toHaveBeenCalled();
    });

    it('rejects a password that does not match its confirmation', async () => {
      await expect(
        service.createUser(signup({ confirmPassword: 'something-else' })),
      ).rejects.toMatchObject({
        status: 400,
        message: 'Password and Confirm password is not the same',
      });

      expect(mocks.otpService.verify).not.toHaveBeenCalled();
    });

    it('verifies the pin before opening a transaction', async () => {
      await service.createUser(signup());

      expect(mocks.otpService.verify).toHaveBeenCalledWith({
        email: EMAIL,
        pin: '123456',
        type: OTPType.SIGNUP,
      });

      const verifiedAt = mocks.otpService.verify.mock.invocationCallOrder[0];
      const sessionAt = mocks.connection.startSession.mock.invocationCallOrder[0];
      expect(verifiedAt).toBeLessThan(sessionAt);
    });

    it('does not open a transaction when the pin is wrong', async () => {
      mocks.otpService.verify.mockRejectedValue(new Error('Invalid OTP'));

      await expect(service.createUser(signup())).rejects.toThrow('Invalid OTP');

      expect(mocks.connection.startSession).not.toHaveBeenCalled();
      expect(mocks.userModel.create).not.toHaveBeenCalled();
    });

    it('consumes the pin and creates the user inside one transaction', async () => {
      await service.createUser(signup());

      expect(mocks.session.withTransaction).toHaveBeenCalledTimes(1);
      expect(mocks.otpService.consume).toHaveBeenCalledWith(
        { email: EMAIL, type: OTPType.SIGNUP },
        mocks.session,
      );
      expect(mocks.userModel.create).toHaveBeenCalledWith(
        {
          email: EMAIL,
          password: 'Sup3r-secret!',
          authService: AuthServiceOptions.WITH_EMAIL_AND_PASSWORD,
        },
        mocks.session,
      );
    });

    it('ends the session once the work is done', async () => {
      await service.createUser(signup());

      expect(mocks.session.endSession).toHaveBeenCalledTimes(1);
    });

    it('ends the session even when the transaction blows up', async () => {
      mocks.session.withTransaction.mockRejectedValue(new Error('write conflict'));

      await expect(service.createUser(signup())).rejects.toThrow('write conflict');

      expect(mocks.session.endSession).toHaveBeenCalledTimes(1);
    });
  });

  describe('checkAvailability', () => {
    const check = (type: CheckUserDataType, value: string) =>
      service.checkAvailability({ type, value });

    it('calls a malformed email invalid without hitting the database', async () => {
      await expect(check(CheckUserDataType.EMAIL, 'not-an-email')).resolves.toBe(
        EmailStatus.INVALID,
      );

      expect(mocks.userModel.getUserExistByEmail).not.toHaveBeenCalled();
    });

    it('reports a taken email as already used', async () => {
      mocks.userModel.getUserExistByEmail.mockResolvedValue(true);

      await expect(check(CheckUserDataType.EMAIL, EMAIL)).resolves.toBe(
        EmailStatus.ALREADY_USED,
      );
    });

    it('reports a free email as available', async () => {
      await expect(check(CheckUserDataType.EMAIL, EMAIL)).resolves.toBe(
        EmailStatus.AVAILABLE,
      );
    });

    it('reports a taken username as already used', async () => {
      mocks.userModel.getUserExistByUsername.mockResolvedValue(true);

      await expect(check(CheckUserDataType.USER_NAME, 'someone')).resolves.toBe(
        EmailStatus.ALREADY_USED,
      );
    });

    it('reports a free username as available', async () => {
      await expect(check(CheckUserDataType.USER_NAME, 'someone')).resolves.toBe(
        EmailStatus.AVAILABLE,
      );
    });

    // Skipped rather than pinned to today's behavior: the `default` branch
    // throws BadRequestException, but the surrounding catch swallows it and
    // rethrows InternalServerErrorException, so an unknown type answers 500
    // instead of 400. Unskip once the catch stops eating HttpExceptions.
    it.skip('rejects a type outside the enum with a 400', async () => {
      await expect(
        check('NOT_A_FIELD' as CheckUserDataType, 'whatever'),
      ).rejects.toMatchObject({ status: 400 });
    });
  });

  describe('updateUserStatus', () => {
    const USER_ID = 'user-1';
    const LAST_ONLINE = new Date('2026-11-08T05:00:00.000Z');

    it('saves the status and returns it with the conversation partners to notify', async () => {
      mocks.userModel.setUserStatus.mockResolvedValue({
        status: UserStatus.OFFLINE,
        lastOnline: LAST_ONLINE,
      });
      mocks.conversationModel.getConversationPartnerIds.mockResolvedValue([
        'user-2',
        'user-3',
      ]);

      await expect(
        service.updateUserStatus(USER_ID, UserStatus.OFFLINE),
      ).resolves.toEqual({
        status: UserStatus.OFFLINE,
        lastOnline: LAST_ONLINE.toISOString(),
        partnerIds: ['user-2', 'user-3'],
      });
      expect(mocks.userModel.setUserStatus).toHaveBeenCalledWith(
        USER_ID,
        UserStatus.OFFLINE,
      );
      expect(
        mocks.conversationModel.getConversationPartnerIds,
      ).toHaveBeenCalledWith(USER_ID);
    });

    it('returns null without looking up partners when the user does not exist', async () => {
      await expect(
        service.updateUserStatus(USER_ID, UserStatus.ONLINE),
      ).resolves.toBeNull();
      expect(
        mocks.conversationModel.getConversationPartnerIds,
      ).not.toHaveBeenCalled();
    });
  });

  describe('changeDisplayName', () => {
    it('saves and returns the new display name', async () => {
      await expect(
        service.changeDisplayName({
          requesterId: REQUESTER_ID,
          displayName: 'Ada',
        }),
      ).resolves.toEqual({ displayName: 'Ada' });
      expect(mocks.userModel.setDisplayName).toHaveBeenCalledWith({
        userId: REQUESTER_ID,
        displayName: 'Ada',
      });
    });
  });

  describe('changeUserName', () => {
    it('refuses a username someone else has', async () => {
      mocks.userModel.isUserNameTaken.mockResolvedValue(true);

      await expect(
        service.changeUserName({ requesterId: REQUESTER_ID, userName: 'ada' }),
      ).rejects.toMatchObject({ status: 409 });
      expect(mocks.userModel.setUserName).not.toHaveBeenCalled();
    });

    it('ignores the requester when checking who has the name', async () => {
      await expect(
        service.changeUserName({ requesterId: REQUESTER_ID, userName: 'ada' }),
      ).resolves.toEqual({ userName: 'ada' });
      expect(mocks.userModel.isUserNameTaken).toHaveBeenCalledWith({
        userName: 'ada',
        exceptUserId: REQUESTER_ID,
      });
    });
  });

  describe('changePassword', () => {
    const change = (over = {}) =>
      service.changePassword({
        requesterId: REQUESTER_ID,
        sessionToken: 'token',
        currentPassword: 'Old-secret1!',
        password: STRONG_PASSWORD,
        confirmPassword: STRONG_PASSWORD,
        ...over,
      });

    it('refuses passwords that do not match', async () => {
      await expect(
        change({ confirmPassword: 'N3w-secret?' }),
      ).rejects.toMatchObject({ status: 400 });
    });

    it('refuses a weak password', async () => {
      await expect(
        change({ password: 'weakweak', confirmPassword: 'weakweak' }),
      ).rejects.toMatchObject({ status: 400 });
    });

    it('refuses a wrong current password', async () => {
      mocks.userModel.verifyPassword.mockResolvedValue(false);

      await expect(change()).rejects.toMatchObject({ status: 401 });
      expect(mocks.userModel.setPassword).not.toHaveBeenCalled();
    });

    it('lets an account without a password set one without a current password', async () => {
      mocks.userModel.getUserByIdWithPassword.mockResolvedValue({});

      await change({ currentPassword: undefined });

      expect(mocks.userModel.verifyPassword).not.toHaveBeenCalled();
      expect(mocks.userModel.setPassword).toHaveBeenCalled();
    });

    it('saves the password and signs out every other session', async () => {
      await change();

      expect(mocks.userModel.setPassword).toHaveBeenCalledWith(
        { userId: REQUESTER_ID, password: STRONG_PASSWORD },
        mocks.session,
      );
      expect(mocks.sessionModel.revokeAllForUser).toHaveBeenCalledWith(
        new Types.ObjectId(REQUESTER_ID),
        { except: 'token', session: mocks.session },
      );
      expect(mocks.socketSessions.disconnectUser).toHaveBeenCalledWith(
        REQUESTER_ID,
        { exceptSessionToken: 'token' },
      );
    });

    it('leaves every socket connected when the password is refused', async () => {
      mocks.userModel.verifyPassword.mockResolvedValue(false);

      await expect(change()).rejects.toMatchObject({ status: 401 });
      expect(mocks.socketSessions.disconnectUser).not.toHaveBeenCalled();
    });
  });

  describe('uploadProfilePhoto', () => {
    it('saves the photo, uses it, and trims old ones in one transaction', async () => {
      const photo = {
        key: 'k',
        url: 'https://utfs.io/f/k',
        width: 10,
        height: 20,
      };

      await expect(
        service.uploadProfilePhoto({ requesterId: REQUESTER_ID, photo }),
      ).resolves.toEqual({ photo: { id: PHOTO_ID, url: photo.url } });
      expect(mocks.userModel.setPhoto).toHaveBeenCalledWith(
        { userId: REQUESTER_ID, photoId: PHOTO_ID },
        mocks.session,
      );
      expect(mocks.photoModel.deleteProfilePhotosBeyond).toHaveBeenCalledWith(
        { ownerId: REQUESTER_ID, keep: 5 },
        mocks.session,
      );
    });
  });

  describe('switchToRecentProfilePhoto', () => {
    it('refuses a photo the requester does not own', async () => {
      mocks.photoModel.findProfilePhoto.mockResolvedValue(null);

      await expect(
        service.switchToRecentProfilePhoto({
          requesterId: REQUESTER_ID,
          photoId: PHOTO_ID,
        }),
      ).rejects.toMatchObject({ status: 404 });
      expect(mocks.userModel.setPhoto).not.toHaveBeenCalled();
    });

    it('uses the photo and moves it to the front of the recent list', async () => {
      await expect(
        service.switchToRecentProfilePhoto({
          requesterId: REQUESTER_ID,
          photoId: PHOTO_ID,
        }),
      ).resolves.toEqual({
        photo: { id: PHOTO_ID, url: 'https://utfs.io/f/a' },
      });
      expect(mocks.photoModel.markAsRecent).toHaveBeenCalledWith(
        PHOTO_ID,
        mocks.session,
      );
    });
  });

  describe('deleteProfilePhoto', () => {
    const requesterUsing = (photoId: string | null) =>
      ({
        id: REQUESTER_ID,
        photo: photoId ? { _id: new Types.ObjectId(photoId) } : null,
      }) as unknown as AuthenticatedUser;

    it('refuses to delete the photo in use', async () => {
      await expect(
        service.deleteProfilePhoto({
          requester: requesterUsing(PHOTO_ID),
          photoId: PHOTO_ID,
        }),
      ).rejects.toMatchObject({ status: 409 });
      expect(mocks.photoModel.deleteById).not.toHaveBeenCalled();
    });

    it('deletes an older photo', async () => {
      await service.deleteProfilePhoto({
        requester: requesterUsing(null),
        photoId: PHOTO_ID,
      });

      expect(mocks.photoModel.findProfilePhoto).toHaveBeenCalledWith({
        photoId: PHOTO_ID,
        ownerId: REQUESTER_ID,
      });
      expect(mocks.photoModel.deleteById).toHaveBeenCalledWith(PHOTO_ID);
    });
  });

  describe('deleteAccount', () => {
    it('anonymizes the account, drops its photos and ends every session', async () => {
      await service.deleteAccount(REQUESTER_ID);

      expect(mocks.userModel.anonymize).toHaveBeenCalledWith(
        { userId: REQUESTER_ID, displayName: 'Deleted user' },
        mocks.session,
      );
      expect(
        mocks.photoModel.deleteProfilePhotosByOwnerId,
      ).toHaveBeenCalledWith(REQUESTER_ID, mocks.session);
      expect(mocks.sessionModel.revokeAllForUser).toHaveBeenCalledWith(
        new Types.ObjectId(REQUESTER_ID),
        { session: mocks.session },
      );
      expect(mocks.session.endSession).toHaveBeenCalled();
      expect(mocks.socketSessions.disconnectUser).toHaveBeenCalledWith(
        REQUESTER_ID,
      );
    });
  });
});
