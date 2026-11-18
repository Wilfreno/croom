import type { RawBodyRequest } from '@nestjs/common';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { SESSION_COOKIE } from '@repo/constants';
import type { AuthenticatedUser } from '@repo/types';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { UploadController } from './upload.controller';
import { UploadService } from './upload.service';

function fakeReply() {
  const reply = {
    status: vi.fn(() => reply),
    headers: vi.fn(() => reply),
    send: vi.fn(() => reply),
  };
  return reply;
}

function fakeRequest(overrides: Partial<RawBodyRequest<FastifyRequest>>) {
  return {
    method: 'POST',
    url: '/v1/upload?slug=profilePhoto&actionType=upload',
    protocol: 'http',
    host: 'localhost:4000',
    cookies: { [SESSION_COOKIE]: 'abc' },
    headers: {
      cookie: `${SESSION_COOKIE}=abc`,
      'content-type': 'application/json',
      'content-length': '7',
      'x-forwarded-for': ['1.1.1.1', '2.2.2.2'],
    },
    rawBody: Buffer.from('{"a": 1}'),
    body: { a: 1 },
    ...overrides,
  } as unknown as RawBodyRequest<FastifyRequest>;
}

describe('UploadController', () => {
  let uploadService: {
    handle: ReturnType<typeof vi.fn>;
    deletePendingPhoto?: ReturnType<typeof vi.fn>;
  };
  let controller: UploadController;

  beforeEach(() => {
    uploadService = {
      handle: vi.fn().mockResolvedValue(
        new Response('{"ok":true}', {
          status: 201,
          headers: { 'content-type': 'application/json' },
        }),
      ),
    };
    controller = new UploadController(
      uploadService as unknown as UploadService,
    );
  });

  it('hands UploadThing the request with its exact raw body', async () => {
    await controller.handle(
      fakeRequest({}),
      fakeReply() as unknown as FastifyReply,
    );

    const request = uploadService.handle.mock.calls[0][0] as Request;
    expect(request.method).toBe('POST');
    expect(request.url).toBe(
      'http://localhost:4000/v1/upload?slug=profilePhoto&actionType=upload',
    );
    expect(uploadService.handle.mock.calls[0][1]).toBe('abc');
    expect(request.headers.get('x-forwarded-for')).toBe('1.1.1.1,2.2.2.2');
    await expect(request.text()).resolves.toBe('{"a": 1}');
  });

  it('falls back to the parsed body when there is no raw body', async () => {
    await controller.handle(
      fakeRequest({ rawBody: undefined }),
      fakeReply() as unknown as FastifyReply,
    );

    const request = uploadService.handle.mock.calls[0][0] as Request;
    await expect(request.text()).resolves.toBe('{"a":1}');
  });

  it('sends no body for a GET', async () => {
    await controller.handle(
      fakeRequest({ method: 'GET', url: '/v1/upload' }),
      fakeReply() as unknown as FastifyReply,
    );

    const request = uploadService.handle.mock.calls[0][0] as Request;
    expect(request.body).toBeNull();
  });

  it('relays the UploadThing response', async () => {
    const reply = fakeReply();

    await controller.handle(fakeRequest({}), reply as unknown as FastifyReply);

    expect(reply.status).toHaveBeenCalledWith(201);
    expect(reply.headers).toHaveBeenCalledWith({
      'content-type': 'application/json',
    });
    expect(reply.send).toHaveBeenCalledWith('{"ok":true}');
  });

  it('deletes a pending photo of the current user', async () => {
    uploadService.deletePendingPhoto = vi.fn().mockResolvedValue(undefined);

    await controller.deletePendingPhoto({ id: 'me' } as AuthenticatedUser, {
      photoId: 'p1',
    });

    expect(uploadService.deletePendingPhoto).toHaveBeenCalledWith({
      requesterId: 'me',
      photoId: 'p1',
    });
  });
});
