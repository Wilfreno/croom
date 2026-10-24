import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { requireEnv } from '@repo/utils';
import { createTransport, type Transporter } from 'nodemailer';
import type SMTPPool from 'nodemailer/lib/smtp-pool';
import { MAIL_TRANSPORT } from '@repo/constants';
import { MailService } from './mail.service';

@Global()
@Module({
  providers: [
    {
      provide: MAIL_TRANSPORT,
      inject: [ConfigService],
      useFactory: (
        configService: ConfigService,
      ): Transporter<SMTPPool.SentMessageInfo> =>
        createTransport({
          host: 'smtp.gmail.com',
          port: 465,
          secure: true,
          auth: {
            user: requireEnv(configService, 'GMAIL_USER'),
            pass: requireEnv(configService, 'GMAIL_2F_AUTH_APP_PASS'),
          },
          pool: true,
          maxConnections: 5,
        }),
    },
    MailService,
  ],
  exports: [MailService],
})
export class MailModule {}
