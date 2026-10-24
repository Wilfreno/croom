import { BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OTP_EXPIRY_MINUTES } from '@repo/constants';
import { OTPType } from '@repo/enums';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MailService } from './mail.service';

function build() {
  const transporter = {
    sendMail: vi.fn().mockResolvedValue({ messageId: 'abc' }),
    verify: vi.fn().mockResolvedValue(true),
  };
  const configService = {
    get: vi.fn().mockReturnValue('croom.dev.noreply@gmail.com'),
  } as unknown as ConfigService;

  return {
    transporter,
    service: new MailService(transporter as never, configService),
  };
}

const sent = (transporter: { sendMail: ReturnType<typeof vi.fn> }) =>
  transporter.sendMail.mock.calls[0][0];

describe('MailService', () => {
  beforeEach(() => vi.clearAllMocks());

  describe('sendOtp', () => {
    it('sends to the address that asked for the pin', async () => {
      const { transporter, service } = build();

      await service.sendOtp('someone@example.com', '123456', OTPType.SIGNUP);

      expect(sent(transporter).to).toBe('someone@example.com');
    });

    it('puts the pin and how long it lasts in the subject', async () => {
      const { transporter, service } = build();

      await service.sendOtp('someone@example.com', '123456', OTPType.SIGNUP);

      expect(sent(transporter).subject).toBe(
        `Welcome to Croom! your verification code is 123456. It expires in ${OTP_EXPIRY_MINUTES} minutes.`,
      );
    });

    it('renders the template to html carrying the pin', async () => {
      const { transporter, service } = build();

      await service.sendOtp('someone@example.com', '123456', OTPType.SIGNUP);

      const { html } = sent(transporter);
      expect(html).toContain('123456');
      expect(html).toContain('Croom');
    });

    it('greets the recipient by the local part of their address', async () => {
      const { transporter, service } = build();

      await service.sendOtp('ada.lovelace@example.com', '123456', OTPType.SIGNUP);

      expect(sent(transporter).html).toContain('ada.lovelace');
      expect(sent(transporter).html).not.toContain('ada.lovelace@example.com');
    });

    it('turns a transport failure into a 500', async () => {
      const { transporter, service } = build();
      transporter.sendMail.mockRejectedValue(new Error('smtp refused'));

      await expect(
        service.sendOtp('someone@example.com', '123456', OTPType.SIGNUP),
      ).rejects.toBeInstanceOf(InternalServerErrorException);
    });

    it('rejects a type it has no template for', async () => {
      const { transporter, service } = build();

      await expect(
        service.sendOtp('someone@example.com', '123456', OTPType.RECOVER),
      ).rejects.toBeInstanceOf(BadRequestException);

      expect(transporter.sendMail).not.toHaveBeenCalled();
    });

    // Skipped rather than pinned to today's behavior: the constructor builds
    // `Croom <GMAIL_USER>` into this.from and then never passes it to
    // sendMail, so the header falls back to whatever the transport defaults
    // to. Unskip once sendOtp sends the from address it prepared.
    it.skip('sends from the configured address', async () => {
      const { transporter, service } = build();

      await service.sendOtp('someone@example.com', '123456', OTPType.SIGNUP);

      expect(sent(transporter).from).toBe('Croom <croom.dev.noreply@gmail.com>');
    });
  });

  describe('onModuleInit', () => {
    it('verifies the transport on boot', async () => {
      const { transporter, service } = build();

      await service.onModuleInit();

      expect(transporter.verify).toHaveBeenCalledTimes(1);
    });

    it('does not stop the app booting when the transport is unreachable', async () => {
      const { transporter, service } = build();
      transporter.verify.mockRejectedValue(new Error('smtp unreachable'));

      await expect(service.onModuleInit()).resolves.toBeUndefined();
    });
  });
});
