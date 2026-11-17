import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { UserModule } from '../user/user.module';
import { MessageGateway } from './message.gateway';

@Module({
  imports: [AuthModule, UserModule],
  providers: [MessageGateway],
  exports: [MessageGateway],
})
export class MessageGatewayModule {}
