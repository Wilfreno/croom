import { Inject, Injectable, Logger } from '@nestjs/common';
import { UPLOADTHING_API } from '@repo/constants';
import type { UTApi } from 'uploadthing/server';

@Injectable()
export class UploadedFilesService {
  private readonly logger = new Logger(UploadedFilesService.name);

  constructor(@Inject(UPLOADTHING_API) private readonly utApi: UTApi) {}

  async deleteFiles(keys: string[]) {
    if (keys.length === 0) return;

    try {
      const result = await this.utApi.deleteFiles(keys);
      if (!result.success)
        this.logger.error(
          `could not delete uploaded files: ${keys.join(', ')}`,
        );
    } catch (error) {
      this.logger.error(error);
    }
  }
}
