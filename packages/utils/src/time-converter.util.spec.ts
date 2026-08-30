import { SECONDS_IN_HOUR, SECONDS_IN_MINUTE } from '@repo/constants';
import { describe, expect, it } from 'vitest';
import { secondsToMinuteAndSeconds } from './time-converter.util';

describe('secondsToMinuteAndSeconds', () => {
  it.each([
    [0, { minute: 0, seconds: 0 }],
    [1, { minute: 0, seconds: 1 }],
    [59, { minute: 0, seconds: 59 }],
    [60, { minute: 1, seconds: 0 }],
    [61, { minute: 1, seconds: 1 }],
    [90, { minute: 1, seconds: 30 }],
    [SECONDS_IN_HOUR, { minute: 60, seconds: 0 }],
  ])('splits %i seconds', (input, expected) => {
    expect(secondsToMinuteAndSeconds(input)).toEqual(expected);
  });

  it('never reports a seconds remainder that is itself a whole minute', () => {
    for (let i = 0; i < 300; i++) {
      expect(secondsToMinuteAndSeconds(i).seconds).toBeLessThan(SECONDS_IN_MINUTE);
    }
  });

  it('round-trips back to the input', () => {
    for (const total of [7, 60, 125, 3599, 3600]) {
      const { minute, seconds } = secondsToMinuteAndSeconds(total);
      expect(minute * SECONDS_IN_MINUTE + seconds).toBe(total);
    }
  });
});
