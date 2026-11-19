import { All, Controller, Delete, Param, Req, Res } from '@nestjs/common';
import type { RawBodyRequest } from '@nestjs/common';
import { SESSION_COOKIE, UPLOAD_ROUTE } from '@repo/constants';
import type { AuthenticatedUser } from '@repo/types';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { PendingPhotoParamDto } from './dto/pending-photo.dto';
import { UploadService } from './upload.service';

const METHODS_WITH_BODY = ['POST', 'PUT', 'PATCH'];

@Controller({ path: UPLOAD_ROUTE, version: '1' })
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Public()
  @All()
  async handle(
    @Req() request: RawBodyRequest<FastifyRequest>,
    @Res() reply: FastifyReply,
  ) {
    const response = await this.uploadService.handle(
      toWebRequest(request),
      request.cookies?.[SESSION_COOKIE],
    );
    const body = await response.text();

    return reply
      .status(response.status)
      .headers(Object.fromEntries(response.headers))
      .send(body);
  }

  @Delete('/:photoId')
  deletePendingPhoto(
    @CurrentUser() user: AuthenticatedUser,
    @Param() { photoId }: PendingPhotoParamDto,
  ) {
    return this.uploadService.deletePendingPhoto({
      requesterId: user.id,
      photoId,
    });
  }
}

function toWebRequest(request: RawBodyRequest<FastifyRequest>) {
  const headers = new Headers();

  for (const [name, value] of Object.entries(request.headers)) {
    if (name === 'content-length') continue;
    if (typeof value === 'string') headers.set(name, value);
    if (Array.isArray(value)) headers.set(name, value.join(','));
  }

  const protocol = request.protocol;
  const url = new URL(request.url, `${protocol}://${request.host}`);
  const hasBody = METHODS_WITH_BODY.includes(request.method);

  return new Request(url, {
    method: request.method,
    headers,
    body: hasBody ? readBody(request) : undefined,
  });
}

function readBody(request: RawBodyRequest<FastifyRequest>) {
  if (request.rawBody) return request.rawBody.toString('utf8');
  if (typeof request.body === 'string') return request.body;
  return JSON.stringify(request.body ?? null);
}
