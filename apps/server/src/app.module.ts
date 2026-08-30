import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { MongooseModule } from '@nestjs/mongoose';
import { RateLimitModule } from '@repo/guards';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './v1/auth/auth.module';
import { UserModule } from './v1/user/user.module';
import { ServerResponseInterceptor } from "./common/interceptors/server-response.interceptor";
import { ServerResponseFilter } from "./common/filters/server-response.filter";
import { MailModule } from './common/mail/mail.module';
import { OtpModule } from './v1/otp/otp.module';

@Module({
  imports: [
    UserModule,
    AuthModule,
    ConfigModule.forRoot({ isGlobal: true, expandVariables: true }),
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const mongoUri = configService.get<string>(
          'MONGO_DB_CONNECTION_STRING',
        );

        if (!mongoUri) {
          throw new Error('MONGO_DB_CONNECTION_STRING is missing in .env');
        }

        return {
          uri: mongoUri,
        };
      },
    }),
    MailModule,
    OtpModule,
    RateLimitModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_INTERCEPTOR, useClass: ServerResponseInterceptor },
    { provide: APP_FILTER, useClass: ServerResponseFilter },
  ],
})
export class AppModule {}
