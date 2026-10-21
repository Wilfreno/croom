import {
  BadRequestException,
  ConflictException,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { OTP_MAX_LIVE, SECONDS_IN_MINUTE } from '@repo/constants';
import { OTPType } from '@repo/enums';
import { OtpAttemptModel, OtpModel, UserModel } from '@repo/models';
import { ClientSession, Connection } from 'mongoose';
import { MailService } from '../../common/mail/mail.service';
import { CreateOtpDto } from './dto/create-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
@Injectable()
export class OtpService {
  private readonly logger = new Logger(OtpService.name);

  constructor(
    @InjectConnection() private readonly connection: Connection,
    private readonly userModel: UserModel,
    private readonly otpModel: OtpModel,
    private readonly otpAttemptModel: OtpAttemptModel,
    private readonly mailService: MailService,
  ) {}

  private async assertNotLockedOut(target: { email: string; type: OTPType }) {
    const lockedFor = await this.otpAttemptModel.getLockRemainder(target);

    if (lockedFor > 0) throw this.lockedOut(lockedFor);
  }

  private lockedOut(seconds: number) {
    const minutes = Math.ceil(seconds / SECONDS_IN_MINUTE);

    return new HttpException(
      `too many incorrect codes, try again in ${minutes} minute${minutes === 1 ? '' : 's'}`,
      HttpStatus.TOO_MANY_REQUESTS,
    );
  }

  async create({ email, type }: CreateOtpDto) {
    await this.assertNotLockedOut({ email, type });

    const userExist = await this.userModel.getUserExistByEmail(email);

    switch (type) {
      case OTPType.SIGNUP: {
        if (userExist) throw new ConflictException('email already used');
        break;
      }
      case OTPType.RECOVER: {
        if (!userExist) throw new NotFoundException('account does not exist');
        break;
      }
      default:
        this.logger.error('type must be value of OTPType');
        throw new BadRequestException();
    }

    const pin = await this.otpModel.create({ email, type });

    await this.otpModel.trim({ email, type }, OTP_MAX_LIVE);
    await this.mailService.sendOtp(email, pin, type);
  }

  async verify({ email, type, pin }: VerifyOtpDto): Promise<void> {
    await this.assertNotLockedOut({ email, type });

    const live = await this.otpModel.getPins({ email, type });

    if (!live.length)
      throw new BadRequestException('the code has expired, request a new one');

    let matched = false;

    for (const hashedPin of live) {
      if (await this.otpModel.compare({ pin, hashedPin })) {
        matched = true;
        break;
      }
    }

    if (!matched) {
      const lockedFor = await this.otpAttemptModel.registerFailure({
        email,
        type,
      });

      if (lockedFor > 0) {
        await this.otpModel.deleteOtpByEmail({ email, type });
        throw this.lockedOut(lockedFor);
      }
      throw new BadRequestException('Invalid OTP');
    }
    await this.otpAttemptModel.clearStreak({ email, type });
  }

  async consume(
    { email, type }: { email: string; type: OTPType },
    session?: ClientSession,
  ): Promise<void> {
    await this.otpModel.deleteOtpByEmail({ email, type }, session);
  }
}
