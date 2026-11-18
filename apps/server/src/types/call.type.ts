import type { MessageNoticeType } from '@repo/enums';

export type CallNoticeType =
  | MessageNoticeType.CALL_RING
  | MessageNoticeType.CALL_STARTED
  | MessageNoticeType.CALL_ENDED
  | MessageNoticeType.CALL_MISSED;
