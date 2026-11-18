export enum MessageStatus {
  DELETED = 'DELETED',
  UPDATED = 'UPDATED',
}

export enum MessageNoticeType {
  NICKNAME = 'NICKNAME',
  CALL_RING = 'CALL_RING',
  CALL_STARTED = 'CALL_STARTED',
  CALL_ENDED = 'CALL_ENDED',
  CALL_MISSED = 'CALL_MISSED',
}

export const CALL_MESSAGE_NOTICE_TYPES: MessageNoticeType[] = [
  MessageNoticeType.CALL_RING,
  MessageNoticeType.CALL_STARTED,
  MessageNoticeType.CALL_ENDED,
  MessageNoticeType.CALL_MISSED,
];
