import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PhotoModel } from '@repo/models';
import { Message, MessageSchema, Photo, PhotoSchema } from '@repo/schemas';
import { UploadedFilesModule } from '../../common/uploaded-files/uploaded-files.module';
import { AuthModule } from '../auth/auth.module';
import { UserModule } from '../user/user.module';
import { UploadController } from './upload.controller';
import { UploadService } from './upload.service';

@Module({
  imports: [
    AuthModule,
    UserModule,
    UploadedFilesModule,
    MongooseModule.forFeature([
      { name: Photo.name, schema: PhotoSchema },
      { name: Message.name, schema: MessageSchema },
    ]),
  ],
  controllers: [UploadController],
  providers: [UploadService, PhotoModel],
})
export class UploadModule {}
