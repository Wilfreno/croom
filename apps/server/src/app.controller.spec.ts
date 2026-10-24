import { Test } from '@nestjs/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  const appService = { getHello: vi.fn() };
  let controller: AppController;

  beforeEach(async () => {
    vi.clearAllMocks();

    const moduleRef = await Test.createTestingModule({
      controllers: [AppController],
      providers: [{ provide: AppService, useValue: appService }],
    }).compile();

    controller = moduleRef.get(AppController);
  });

  // The route carries @ResponseMessage('hello world'), so the body a caller
  // sees is the envelope the interceptor builds, not this return value.
  // server-response.spec.ts covers that wrapping.
  it('delegates to the service', () => {
    controller.getHello();

    expect(appService.getHello).toHaveBeenCalledTimes(1);
  });
});
