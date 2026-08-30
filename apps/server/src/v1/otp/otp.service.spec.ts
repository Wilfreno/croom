import { getConnectionToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { OtpModel, UserModel } from '@repo/models';
import { MailService } from '../../common/mail/mail.service';
import { OtpService } from './otp.service';

describe('OtpService', () => {
  let service: OtpService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OtpService,
        {
          provide: getConnectionToken(),
          useValue: { startSession: jest.fn() },
        },
        { provide: UserModel, useValue: { getUserExistByEmail: jest.fn() } },
        {
          provide: OtpModel,
          useValue: { createOtp: jest.fn(), deleteOtpByEmail: jest.fn() },
        },
        { provide: MailService, useValue: { sendOtp: jest.fn() } },
      ],
    }).compile();

    service = module.get<OtpService>(OtpService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
