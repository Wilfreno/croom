import { Body, Controller, Post } from '@nestjs/common';
import { OTP_REQUEST_LIMIT, SECONDS_IN_MINUTE } from '@repo/constants';
import { RateLimit } from '@repo/guards';
import { Public } from '../auth/decorators/public.decorator';
import { CreateOtpDto } from './dto/create-otp.dto';
import { OtpService } from './otp.service';

@Controller({ path: 'otp', version: '1' })
export class OtpController {
  constructor(private readonly otpService: OtpService) {}

  @Public()
  @Post()
  @RateLimit({
    limit: OTP_REQUEST_LIMIT,
    window: SECONDS_IN_MINUTE,
    by: ['body.email'],
  })
  create(@Body() createOtpDto: CreateOtpDto) {
    return this.otpService.create(createOtpDto);
  }
}
