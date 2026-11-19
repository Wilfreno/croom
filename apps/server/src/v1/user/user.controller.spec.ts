import { Test } from '@nestjs/testing';
import { SESSION_COOKIE } from '@repo/constants';
import { AuthServiceOptions, CheckUserDataType, EmailStatus } from '@repo/enums';
import type { AuthenticatedUser } from '@repo/types';
import type { FastifyRequest } from 'fastify';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CreateUserDto } from './dto/create-user.dto';
import { UserController } from './user.controller';
import { UserService } from './user.service';

describe('UserController', () => {
  const userService = {
    createUser: vi.fn().mockResolvedValue(undefined),
    checkAvailability: vi.fn().mockResolvedValue(EmailStatus.AVAILABLE),
    changeDisplayName: vi.fn().mockResolvedValue({ displayName: 'Ada' }),
    changeUserName: vi.fn().mockResolvedValue({ userName: 'ada' }),
    changePassword: vi.fn().mockResolvedValue(undefined),
    getProfilePhotos: vi.fn().mockResolvedValue([]),
    switchToRecentProfilePhoto: vi.fn().mockResolvedValue({ photo: {} }),
    deleteProfilePhoto: vi.fn().mockResolvedValue(undefined),
    deleteAccount: vi.fn().mockResolvedValue(undefined),
  };
  const requester = { id: 'requester-1' } as AuthenticatedUser;
  const PHOTO_ID = '507f1f77bcf86cd799439022';
  let controller: UserController;

  beforeEach(async () => {
    vi.clearAllMocks();

    const moduleRef = await Test.createTestingModule({
      controllers: [UserController],
      providers: [{ provide: UserService, useValue: userService }],
    }).compile();

    controller = moduleRef.get(UserController);
  });

  it('hands the signup body to the service untouched', async () => {
    const body = {
      email: 'someone@example.com',
      password: 'sup3rsecret',
      confirmPassword: 'sup3rsecret',
      pin: '123456',
      authService: AuthServiceOptions.WITH_EMAIL_AND_PASSWORD,
    } as CreateUserDto;

    await controller.createUser(body);

    expect(userService.createUser).toHaveBeenCalledWith(body);
  });

  it('passes the check params through and returns the verdict', async () => {
    const param = { type: CheckUserDataType.EMAIL, value: 'someone@example.com' };
    userService.checkAvailability.mockResolvedValue(EmailStatus.ALREADY_USED);

    await expect(controller.checkAvailability(param)).resolves.toBe(
      EmailStatus.ALREADY_USED,
    );
    expect(userService.checkAvailability).toHaveBeenCalledWith(param);
  });

  it('changes the display name of the requester', async () => {
    await expect(
      controller.changeDisplayName(requester, { displayName: 'Ada' }),
    ).resolves.toEqual({ displayName: 'Ada' });
    expect(userService.changeDisplayName).toHaveBeenCalledWith({
      requesterId: 'requester-1',
      displayName: 'Ada',
    });
  });

  it('changes the username of the requester', async () => {
    await controller.changeUserName(requester, { userName: 'ada' });

    expect(userService.changeUserName).toHaveBeenCalledWith({
      requesterId: 'requester-1',
      userName: 'ada',
    });
  });

  it('passes the session cookie along so this session stays signed in', async () => {
    const body = {
      currentPassword: 'old',
      password: 'N3w-secret!',
      confirmPassword: 'N3w-secret!',
    };
    const request = {
      cookies: { [SESSION_COOKIE]: 'token-1' },
    } as unknown as FastifyRequest;

    await controller.changePassword(requester, body, request);

    expect(userService.changePassword).toHaveBeenCalledWith({
      ...body,
      requesterId: 'requester-1',
      sessionToken: 'token-1',
    });
  });

  it('lists the requester profile photos', async () => {
    await controller.getProfilePhotos(requester);

    expect(userService.getProfilePhotos).toHaveBeenCalledWith('requester-1');
  });

  it('switches to a recent profile photo', async () => {
    await controller.switchToRecentProfilePhoto(requester, {
      photoId: PHOTO_ID,
    });

    expect(userService.switchToRecentProfilePhoto).toHaveBeenCalledWith({
      requesterId: 'requester-1',
      photoId: PHOTO_ID,
    });
  });

  it('deletes a profile photo of the requester', async () => {
    await controller.deleteProfilePhoto(requester, { photoId: PHOTO_ID });

    expect(userService.deleteProfilePhoto).toHaveBeenCalledWith({
      requesterId: 'requester-1',
      photoId: PHOTO_ID,
    });
  });

  it('deletes the requester account', async () => {
    await controller.deleteAccount(requester);

    expect(userService.deleteAccount).toHaveBeenCalledWith('requester-1');
  });
});
