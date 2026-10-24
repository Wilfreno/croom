import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

global.ResizeObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// input-otp polls this from a timer to spot a password-manager badge. jsdom
// does not implement it, so without a stub the timer throws after teardown and
// vitest reports it as an unhandled error even when every test passed.
if (!document.elementFromPoint) {
  document.elementFromPoint = () => null;
}

// input-otp schedules timers at 0ms, 10ms and 50ms from an effect that returns
// no cleanup, so unmounting cannot cancel them. Left pending they fire once
// jsdom has gone and surface as unhandled errors, so unmount and then hold the
// window open just past the last of them.
const INPUT_OTP_LAST_TIMER_MS = 50;

afterEach(async () => {
  cleanup();
  await new Promise((resolve) => setTimeout(resolve, INPUT_OTP_LAST_TIMER_MS + 10));
});

process.env.NEXT_PUBLIC_SERVER = 'http://localhost:8000';
process.env.CLIENT_URL = 'http://localhost:3000';
process.env.UPLOADTHING_TOKEN = 'mock-token';
