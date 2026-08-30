import { ConsoleLogger } from '@nestjs/common';
import { beforeEach, vi } from 'vitest';

// Every model logs through Nest's Logger on the driver-failure paths these
// tests drive, so silence the console backend they write through.
const METHODS = ['log', 'error', 'warn', 'debug', 'verbose', 'fatal'] as const;

function silence() {
  for (const method of METHODS) {
    vi.spyOn(ConsoleLogger.prototype, method).mockImplementation(() => undefined);
  }
}

silence();
beforeEach(silence);
