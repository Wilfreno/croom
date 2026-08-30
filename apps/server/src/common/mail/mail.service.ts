import {
  BadRequestException,
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { render } from '@react-email/components';
import { OTPType } from '@repo/enums';
import type { Transporter } from 'nodemailer';
import type SMTPPool from 'nodemailer/lib/smtp-pool';
import SignUpEmail from '../email-templates/SignUpEmail';
import { MAIL_TRANSPORT } from '@repo/constants';
import { OTP_EXPIRY_MINUTES } from "@repo/constants";

@Injectable()
export class MailService implements OnModuleInit {
  private readonly logger = new Logger(MailService.name);
  private readonly from: string;

  constructor(
    @Inject(MAIL_TRANSPORT)
    private readonly transporter: Transporter<SMTPPool.SentMessageInfo>,
    configService: ConfigService,
  ) {
    this.from = `Croom <${configService.get<string>('GMAIL_USER')}>`;
  }

  async onModuleInit() {
    try {
      await this.transporter.verify();
      this.logger.log('SMTP transport ready');
    } catch (error) {
      this.logger.error('SMTP transport failed to connect', error);
    }
  }

  async sendOtp(email: string, pin: string, type: OTPType) {
    switch (type) {
      case OTPType.SIGNUP: {
        try {
          const html = await render(
            SignUpEmail({
              username: email.substring(0, email.indexOf('@')),
              code: pin,
            }),
          );

          return await this.transporter.sendMail({
            to: email,
            subject: `Welcome to Croom! your verification code is ${pin}. It expires in ${OTP_EXPIRY_MINUTES} minutes.`,
            html,
          });
        } catch (error) {
          this.logger.error(error);
          throw new InternalServerErrorException();
        }
      }
      default:
        this.logger.error('type must be value of OTPType');
        throw new BadRequestException();
    }
  }
}
