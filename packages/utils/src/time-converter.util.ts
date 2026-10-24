import { SECONDS_IN_MINUTE } from '@repo/constants';

export function secondsToMinuteAndSeconds(seconds: number) {
  const minute = Math.floor(seconds / SECONDS_IN_MINUTE);
  const remainder = seconds % SECONDS_IN_MINUTE;
  return { minute, seconds: remainder };
}
