import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import {
  AuthServiceOptions,
  CheckUserDataType,
  EmailStatus,
  OTPType,
} from '@repo/enums';
import { UserModel } from '@repo/models';
import { isEmail } from '@repo/utils';
import { Connection } from 'mongoose';
import { OtpService } from '../otp/otp.service';
import { CheckValueDTO } from './dto/check-value.dto';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);
  constructor(
    @InjectConnection() private readonly connection: Connection,
    private readonly userModel: UserModel,
    private readonly otpService: OtpService,
  ) {}

  async createUser({
    email,
    password,
    confirmPassword,
    pin,
    authService,
  }: CreateUserDto) {
    if (await this.userModel.getUserExistByEmail(email))
      throw new ConflictException('Email already used');

    switch (authService) {
      case AuthServiceOptions.WITH_EMAIL_AND_PASSWORD: {
        if (!password) throw new BadRequestException('Password is required');
        if (!confirmPassword)
          throw new BadRequestException(
            'Re-enter your password on "Confirm password" field',
          );

        if (password !== confirmPassword)
          throw new BadRequestException(
            'Password and Confirm password is not the same',
          );

        if (!pin) throw new BadRequestException('OTP is required');

        await this.otpService.verify({ email, pin, type: OTPType.SIGNUP });
        break;
      }
    }

    const session = await this.connection.startSession();

    try {
      return await session.withTransaction(async () => {
        switch (authService) {
          case AuthServiceOptions.WITH_EMAIL_AND_PASSWORD: {
            await this.otpService.consume(
              { email, type: OTPType.SIGNUP },
              session,
            );

            await this.userModel.create({
              email,
              password,
              authService,
            });

            break;
          }
        }
      });
    } finally {
      await session.endSession();
    }
  }

  async checkAvailability({ type, value }: CheckValueDTO) {
    try {
      switch (type) {
        case CheckUserDataType.EMAIL: {
          if (!isEmail(value)) return EmailStatus.INVALID;

          if (await this.userModel.getUserExistByEmail(value))
            return EmailStatus.ALREADY_USED;
          break;
        }
        case CheckUserDataType.USER_NAME: {
          if (await this.userModel.getUserExistByUsername(value))
            return EmailStatus.ALREADY_USED;
          break;
        }
        default: {
          this.logger.error('type must be a value of CheckUserDataType enum');
          throw new BadRequestException();
        }
      }

      return EmailStatus.AVAILABLE;
    } catch (error) {
      this.logger.error(error);
      throw new InternalServerErrorException();
    }
  }

}
