import { Module } from '@nestjs/common';
import { SocketSessionsModule } from '../../common/socket-sessions/socket-sessions.module';
import { AuthModule } from '../auth/auth.module';
import { UserModule } from '../user/user.module';
import { MessageGateway } from './message.gateway';

@Module({
  imports: [AuthModule, UserModule, SocketSessionsModule],
  providers: [MessageGateway],
  exports: [MessageGateway],
})
export class MessageGatewayModule {}
