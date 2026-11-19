import { Module } from '@nestjs/common';
import { SocketSessionsService } from './socket-sessions.service';

@Module({
  providers: [SocketSessionsService],
  exports: [SocketSessionsService],
})
export class SocketSessionsModule {}
