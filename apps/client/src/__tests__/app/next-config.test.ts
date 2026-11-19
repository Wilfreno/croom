import nextConfig from '../../../next.config';
import { hasRemoteMatch } from 'next/dist/shared/lib/match-remote-pattern';
import { describe, expect, it } from 'vitest';

const remotePatterns = nextConfig.images?.remotePatterns ?? [];
const canDisplay = (url: string) => hasRemoteMatch([], remotePatterns, new URL(url));

describe('next.config images', () => {
  it.each([
    'https://abc123.ufs.sh/f/uploaded-key',
    'https://utfs.io/f/older-key',
    'https://lh3.googleusercontent.com/a/google-avatar',
  ])('allows %s', (url) => {
    expect(canDisplay(url)).toBe(true);
  });

  it.each(['http://abc123.ufs.sh/f/uploaded-key', 'https://abc123.ufs.sh/other/path', 'https://example.com/photo.png'])(
    'refuses %s',
    (url) => {
      expect(canDisplay(url)).toBe(false);
    },
  );
});
