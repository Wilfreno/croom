import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UserModel } from '@repo/models';
import { User, UserSchema } from '@repo/schemas';
import { OtpModule } from '../otp/otp.module';
import { UserController } from './user.controller';
import { UserService } from './user.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    OtpModule,
  ],
  controllers: [UserController],
  providers: [UserModel, UserService],
  exports: [UserService],
})
export class UserModule {}
