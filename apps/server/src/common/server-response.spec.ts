import {
  Controller,
  Get,
  HttpCode,
  NotFoundException,
  Post,
} from '@nestjs/common';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { Test } from '@nestjs/testing';
import {
  ResponseMessage,
  Respond,
} from './decorators/server-response.decorator';
import { ServerException } from './exceptions/server-response.exception';
import { ServerResponseFilter } from './filters/server-response.filter';
import { ServerResponseInterceptor } from './interceptors/server-response.interceptor';
import { respond } from './utils/server-response.util';

@Controller('t')
class TestController {
  @Get('plain')
  plain() {
    return { id: 1 };
  }

  @Post('made')
  @ResponseMessage('user created')
  made() {
    return { id: 2 };
  }

  @Get('empty')
  @HttpCode(200)
  empty() {}

  @Get('both')
  @Respond({ status: 'BLOCKED', message: 'account blocked' })
  both() {
    return { id: 5 };
  }

  @Get('dynamic')
  dynamic() {
    return respond({ id: 3 }, { message: 'hello world' });
  }

  @Get('dynamic-status')
  dynamicStatus() {
    return respond(null, { status: 'BLOCKED', message: 'nope' });
  }

  @Get('dynamic-over-decorator')
  @ResponseMessage('from the decorator')
  dynamicOverDecorator() {
    return respond({ id: 4 }, { message: 'from respond()' });
  }

  @Get('message-payload')
  messagePayload() {
    return { message: 'hello world' };
  }

  @Get('missing')
  missing() {
    throw new NotFoundException('no such user');
  }

  @Get('blocked')
  blocked() {
    throw new ServerException('BLOCKED', 'account blocked');
  }

  @Get('boom')
  boom() {
    throw new Error('kaboom');
  }
}

@Controller('c')
@ResponseMessage('from the controller')
class ControllerLevelController {
  @Get('inherited')
  inherited() {
    return { id: 6 };
  }
}

describe('server response wrapping', () => {
  let app: NestFastifyApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [TestController, ControllerLevelController],
      providers: [
        { provide: APP_INTERCEPTOR, useClass: ServerResponseInterceptor },
        { provide: APP_FILTER, useClass: ServerResponseFilter },
      ],
    }).compile();

    app = moduleRef.createNestApplication<NestFastifyApplication>(
      new FastifyAdapter(),
    );
    await app.init();
    await app.getHttpAdapter().getInstance().ready();
  });

  afterAll(async () => await app.close());

  const call = async (method: 'GET' | 'POST', url: string) => {
    const res = await app.inject({ method, url });
    return { code: res.statusCode, body: res.json() };
  };

  it('wraps a GET', async () => {
    expect(await call('GET', '/t/plain')).toEqual({
      code: 200,
      body: { status: 'OK', message: 'success', data: { id: 1 } },
    });
  });

  it('wraps a POST with a custom message', async () => {
    expect(await call('POST', '/t/made')).toEqual({
      code: 201,
      body: { status: 'CREATED', message: 'user created', data: { id: 2 } },
    });
  });

  it('turns an empty return into null data', async () => {
    expect(await call('GET', '/t/empty')).toEqual({
      code: 200,
      body: { status: 'OK', message: 'success', data: null },
    });
  });

  it('takes both fields from @Respond()', async () => {
    expect(await call('GET', '/t/both')).toEqual({
      code: 200,
      body: { status: 'BLOCKED', message: 'account blocked', data: { id: 5 } },
    });
  });

  it('inherits a controller-level decorator', async () => {
    expect(await call('GET', '/c/inherited')).toEqual({
      code: 200,
      body: { status: 'OK', message: 'from the controller', data: { id: 6 } },
    });
  });

  it('takes the message from respond()', async () => {
    expect(await call('GET', '/t/dynamic')).toEqual({
      code: 200,
      body: { status: 'OK', message: 'hello world', data: { id: 3 } },
    });
  });

  it('takes the status from respond() without changing the HTTP code', async () => {
    expect(await call('GET', '/t/dynamic-status')).toEqual({
      code: 200,
      body: { status: 'BLOCKED', message: 'nope', data: null },
    });
  });

  it('lets respond() win over the decorator', async () => {
    expect(await call('GET', '/t/dynamic-over-decorator')).toEqual({
      code: 200,
      body: { status: 'OK', message: 'from respond()', data: { id: 4 } },
    });
  });

  it('keeps a plain object with a message field as data', async () => {
    expect(await call('GET', '/t/message-payload')).toEqual({
      code: 200,
      body: {
        status: 'OK',
        message: 'success',
        data: { message: 'hello world' },
      },
    });
  });

  it('wraps an HttpException', async () => {
    expect(await call('GET', '/t/missing')).toEqual({
      code: 404,
      body: { status: 'NOT FOUND', message: 'no such user', data: null },
    });
  });

  it('wraps a ServerException', async () => {
    expect(await call('GET', '/t/blocked')).toEqual({
      code: 423,
      body: { status: 'BLOCKED', message: 'account blocked', data: null },
    });
  });

  it('wraps an unexpected error', async () => {
    expect(await call('GET', '/t/boom')).toEqual({
      code: 500,
      body: {
        status: 'INTERNAL SERVER ERROR',
        message: 'internal server error',
        data: null,
      },
    });
  });
});
