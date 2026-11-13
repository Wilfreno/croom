import { getConnectionToken } from '@nestjs/mongoose';
import { Test } from '@nestjs/testing';
import { OTP_MAX_LIVE } from '@repo/constants';
import { OTPType } from '@repo/enums';
import { OtpAttemptModel, OtpModel, UserModel } from '@repo/models';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MailService } from '../../common/mail/mail.service';
import { OtpService } from './otp.service';

const EMAIL = 'someone@example.com';
const target = { email: EMAIL, type: OTPType.SIGNUP };

function build() {
  const userModel = { getUserExistByEmail: vi.fn().mockResolvedValue(false) };
  const otpModel = {
    // The model draws and hashes the pin, answering with the plain one to mail.
    create: vi.fn().mockResolvedValue('042137'),
    // Stored pins are hashes; a fake one here is `hashed:<pin>`.
    compare: vi.fn(async ({ pin, hashedPin }: { pin: string; hashedPin: string }) => hashedPin === `hashed:${pin}`),
    trim: vi.fn().mockResolvedValue(undefined),
    getPins: vi.fn().mockResolvedValue([]),
    deleteOtpByEmail: vi.fn().mockResolvedValue(undefined),
  };
  const otpAttemptModel = {
    getLockRemainder: vi.fn().mockResolvedValue(0),
    registerFailure: vi.fn().mockResolvedValue(0),
    clearStreak: vi.fn().mockResolvedValue(undefined),
  };
  const mailService = { sendOtp: vi.fn().mockResolvedValue(undefined) };

  return { userModel, otpModel, otpAttemptModel, mailService };
}

type Mocks = ReturnType<typeof build>;

async function makeService(mocks: Mocks) {
  const moduleRef = await Test.createTestingModule({
    providers: [
      OtpService,
      { provide: getConnectionToken(), useValue: { startSession: vi.fn() } },
      { provide: UserModel, useValue: mocks.userModel },
      { provide: OtpModel, useValue: mocks.otpModel },
      { provide: OtpAttemptModel, useValue: mocks.otpAttemptModel },
      { provide: MailService, useValue: mocks.mailService },
    ],
  }).compile();

  return moduleRef.get(OtpService);
}

describe('OtpService', () => {
  let mocks: Mocks;
  let service: OtpService;

  beforeEach(async () => {
    vi.clearAllMocks();
    mocks = build();
    service = await makeService(mocks);
  });

  describe('create', () => {
    it('refuses while the email is locked out, and says how long is left', async () => {
      mocks.otpAttemptModel.getLockRemainder.mockResolvedValue(1800);

      await expect(service.create(target)).rejects.toMatchObject({
        status: 429,
        message: 'too many incorrect codes, try again in 30 minutes',
      });

      expect(mocks.otpModel.create).not.toHaveBeenCalled();
      expect(mocks.mailService.sendOtp).not.toHaveBeenCalled();
    });

    it('says "1 minute" rather than "1 minutes"', async () => {
      mocks.otpAttemptModel.getLockRemainder.mockResolvedValue(60);

      await expect(service.create(target)).rejects.toMatchObject({
        message: 'too many incorrect codes, try again in 1 minute',
      });
    });

    it('rounds a part-minute lockout up so it never reads "0 minutes"', async () => {
      mocks.otpAttemptModel.getLockRemainder.mockResolvedValue(5);

      await expect(service.create(target)).rejects.toMatchObject({
        message: 'too many incorrect codes, try again in 1 minute',
      });
    });

    it('rejects a signup for an email that already has an account', async () => {
      mocks.userModel.getUserExistByEmail.mockResolvedValue(true);

      await expect(service.create(target)).rejects.toMatchObject({ status: 409 });
      expect(mocks.mailService.sendOtp).not.toHaveBeenCalled();
    });

    it('rejects a recovery for an email that has no account', async () => {
      mocks.userModel.getUserExistByEmail.mockResolvedValue(false);

      await expect(
        service.create({ email: EMAIL, type: OTPType.RECOVER }),
      ).rejects.toMatchObject({ status: 404 });
      expect(mocks.mailService.sendOtp).not.toHaveBeenCalled();
    });

    it('rejects a type outside the enum', async () => {
      await expect(
        service.create({ email: EMAIL, type: 'SOMETHING_ELSE' as OTPType }),
      ).rejects.toMatchObject({ status: 400 });
    });

    it('stores a pin, trims the live set and mails the same pin through', async () => {
      await service.create(target);

      expect(mocks.otpModel.create).toHaveBeenCalledExactlyOnceWith(target);
      expect(mocks.otpModel.trim).toHaveBeenCalledWith(target, OTP_MAX_LIVE);
      expect(mocks.mailService.sendOtp).toHaveBeenCalledWith(EMAIL, '042137', OTPType.SIGNUP);
    });

    it('trims only after the new pin is stored, so a resend cannot drop it', async () => {
      const order: string[] = [];
      mocks.otpModel.create.mockImplementation(async () => void order.push('create'));
      mocks.otpModel.trim.mockImplementation(async () => void order.push('trim'));

      await service.create(target);

      expect(order).toEqual(['create', 'trim']);
    });
  });

  describe('verify', () => {
    const verify = (pin: string) => service.verify({ ...target, pin });

    it('refuses while the email is locked out', async () => {
      mocks.otpAttemptModel.getLockRemainder.mockResolvedValue(600);

      await expect(verify('123456')).rejects.toMatchObject({ status: 429 });
      expect(mocks.otpModel.getPins).not.toHaveBeenCalled();
    });

    it('reports an expired code when nothing is live', async () => {
      mocks.otpModel.getPins.mockResolvedValue([]);

      await expect(verify('123456')).rejects.toMatchObject({
        status: 400,
        message: 'the code has expired, request a new one',
      });
      expect(mocks.otpAttemptModel.registerFailure).not.toHaveBeenCalled();
    });

    it('accepts the live pin and clears the failure streak', async () => {
      mocks.otpModel.getPins.mockResolvedValue(['hashed:123456']);

      await expect(verify('123456')).resolves.toBeUndefined();

      expect(mocks.otpAttemptModel.clearStreak).toHaveBeenCalledWith(target);
      expect(mocks.otpAttemptModel.registerFailure).not.toHaveBeenCalled();
    });

    it('accepts an earlier pin that is still live after a resend', async () => {
      mocks.otpModel.getPins.mockResolvedValue(['hashed:111111', 'hashed:222222', 'hashed:333333']);

      await expect(verify('111111')).resolves.toBeUndefined();
      expect(mocks.otpAttemptModel.clearStreak).toHaveBeenCalled();
    });

    it('counts a wrong pin against the streak without dropping the live pins', async () => {
      mocks.otpModel.getPins.mockResolvedValue(['hashed:123456']);
      mocks.otpAttemptModel.registerFailure.mockResolvedValue(0);

      await expect(verify('999999')).rejects.toMatchObject({
        status: 400,
        message: 'Invalid OTP',
      });

      expect(mocks.otpAttemptModel.registerFailure).toHaveBeenCalledWith(target);
      expect(mocks.otpModel.deleteOtpByEmail).not.toHaveBeenCalled();
      expect(mocks.otpAttemptModel.clearStreak).not.toHaveBeenCalled();
    });

    it('burns the live pins once a wrong guess trips the lockout', async () => {
      mocks.otpModel.getPins.mockResolvedValue(['hashed:123456']);
      mocks.otpAttemptModel.registerFailure.mockResolvedValue(3600);

      await expect(verify('999999')).rejects.toMatchObject({
        status: 429,
        message: 'too many incorrect codes, try again in 60 minutes',
      });

      expect(mocks.otpModel.deleteOtpByEmail).toHaveBeenCalledWith(target);
    });

    it('rejects a pin of the wrong length', async () => {
      mocks.otpModel.getPins.mockResolvedValue(['hashed:123456']);

      await expect(verify('12345')).rejects.toMatchObject({
        status: 400,
        message: 'Invalid OTP',
      });
    });

    it('checks every live pin even after an early mismatch', async () => {
      mocks.otpModel.getPins.mockResolvedValue(['hashed:111111', 'hashed:222222']);

      await expect(verify('222222')).resolves.toBeUndefined();
      expect(mocks.otpModel.compare).toHaveBeenCalledTimes(2);
    });
  });

  describe('consume', () => {
    it('drops the pins inside the caller session when given one', async () => {
      const session = { id: 'session' } as never;

      await service.consume(target, session);

      expect(mocks.otpModel.deleteOtpByEmail).toHaveBeenCalledWith(target, session);
    });

    it('drops the pins without a session when none is given', async () => {
      await service.consume(target);

      expect(mocks.otpModel.deleteOtpByEmail).toHaveBeenCalledWith(target, undefined);
    });
  });
});
