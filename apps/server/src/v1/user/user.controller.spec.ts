import { Test } from '@nestjs/testing';
import { AuthServiceOptions, CheckUserDataType, EmailStatus } from '@repo/enums';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CreateUserDto } from './dto/create-user.dto';
import { UserController } from './user.controller';
import { UserService } from './user.service';

describe('UserController', () => {
  const userService = {
    createUser: vi.fn().mockResolvedValue(undefined),
    checkAvailability: vi.fn().mockResolvedValue(EmailStatus.AVAILABLE),
  };
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
});
