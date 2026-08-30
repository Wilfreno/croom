import { Test } from '@nestjs/testing';
import { OTPType } from '@repo/enums';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { OtpController } from './otp.controller';
import { OtpService } from './otp.service';

describe('OtpController', () => {
  const otpService = { create: vi.fn().mockResolvedValue(undefined) };
  let controller: OtpController;

  beforeEach(async () => {
    vi.clearAllMocks();

    const moduleRef = await Test.createTestingModule({
      controllers: [OtpController],
      providers: [{ provide: OtpService, useValue: otpService }],
    }).compile();

    controller = moduleRef.get(OtpController);
  });

  it('hands the body to the service untouched', async () => {
    const body = { email: 'someone@example.com', type: OTPType.SIGNUP };

    await controller.create(body);

    expect(otpService.create).toHaveBeenCalledWith(body);
  });

  it('lets a service rejection through rather than swallowing it', async () => {
    otpService.create.mockRejectedValue(new Error('locked out'));

    await expect(
      controller.create({ email: 'someone@example.com', type: OTPType.SIGNUP }),
    ).rejects.toThrow('locked out');
  });
});
