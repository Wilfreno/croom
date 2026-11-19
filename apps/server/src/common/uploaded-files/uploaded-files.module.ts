import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UPLOADTHING_API } from '@repo/constants';
import { requireEnv } from '@repo/utils';
import { UTApi } from 'uploadthing/server';
import { UploadedFilesService } from './uploaded-files.service';

@Module({
  providers: [
    {
      provide: UPLOADTHING_API,
      inject: [ConfigService],
      useFactory: (configService: ConfigService) =>
        new UTApi({ token: requireEnv(configService, 'UPLOADTHING_TOKEN') }),
    },
    UploadedFilesService,
  ],
  exports: [UploadedFilesService],
})
export class UploadedFilesModule {}
