import fastifyCookie from '@fastify/cookie';
import { SERVER_LISTEN_HOST } from '@repo/constants';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { AppModule } from './app.module';
import { SocketIoAdapter } from './common/adapters/socket-io.adapter';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    // Logs one line per request and per response (method, url, status, time)
    // to stdout, which pm2 captures: `pm2 logs croom-server`.
    new FastifyAdapter({ logger: true }),
  );
  const configService = app.get(ConfigService);
  const port = configService.get('PORT');
  const clientUrl = configService.get<string>('CLIENT_URL');
  // Browsers send an Origin of scheme://host[:port] only, so a CLIENT_URL with
  // a path (https://wilfreno.site/croom) has to be cut down to match it.
  const clientOrigin = clientUrl ? new URL(clientUrl).origin : undefined;

  await app.register(fastifyCookie);

  app.enableCors({
    origin: clientOrigin,
    methods: ['GET', 'HEAD', 'POST', 'PATCH', 'PUT', 'DELETE'],
    credentials: true,
  });

  app.useWebSocketAdapter(new SocketIoAdapter(app, clientOrigin));

  app.enableVersioning({
    type: VersioningType.URI,
  });

  app.useGlobalPipes(new ValidationPipe({ transform: true }));
  await app.listen(port, SERVER_LISTEN_HOST);
}
bootstrap();
