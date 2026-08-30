import { ConfigService } from '@nestjs/config';

export function requireEnv(configService: ConfigService, key: string) {
  const value = configService.get<string>(key)?.trim();
  if (!value) throw new Error(`${key} is missing in .env`);

  return value;
}
