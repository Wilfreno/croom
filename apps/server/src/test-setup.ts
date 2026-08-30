import { ConsoleLogger } from '@nestjs/common';
import { beforeEach, vi } from 'vitest';

// Several units log through Nest's Logger on the very failure paths they are
// tested on. Logger.overrideLogger() does not reach the per-instance loggers
// those classes build in their field initializers, so silence the console
// backend they all end up writing through.
const METHODS = ['log', 'error', 'warn', 'debug', 'verbose', 'fatal'] as const;

function silence() {
  for (const method of METHODS) {
    vi.spyOn(ConsoleLogger.prototype, method).mockImplementation(() => undefined);
  }
}

silence();
beforeEach(silence);
