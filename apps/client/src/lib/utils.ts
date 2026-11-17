import type { CallMediaPreferences, CallSession } from "@/types/call.types";
import type { CachedMessage, MessagePages, PhotoInput } from "@/types/message.types";
import type { ServerReplyOfSocketEvent, SocketEventWithServerReply, TypedSocket } from "@/types/socket.types";
import { AVATAR_FALLBACK_COLORS, CALL_TILE_GAP, CALL_DEFAULT_MEDIA_PREFERENCES, CALL_MEDIA_PREFERENCES_STORAGE_KEY, SECONDS_IN_DAY, SECONDS_IN_WEEK, SECONDS_IN_YEAR, SOCKET_SERVER_REPLY_TIMEOUT_MS, SOMETHING_WENT_WRONG } from "@repo/constants";
import { ConversationStatus, UserStatus } from "@repo/enums";
import type { ClientToServerEvents } from "@repo/types";
import { Conversation } from "@repo/types";
import type { Message, MessageNotice, Photo, ServerResponse, User } from "@repo/types";
import type { QueryClient } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function isBlockedMember(conversation: Pick<Conversation, "status" | "blocker"> | undefined, currentUserId?: string) {
  return conversation?.status === ConversationStatus.BLOCKED && conversation.blocker !== currentUserId;
}

export function isBlockedError(error: unknown) {
  return isAxiosError<ServerResponse>(error) && error.response?.data?.status === "BLOCKED";
}

export function isForbiddenError(error: unknown) {
  return isAxiosError(error) && error.response?.status === 403;
}

export function getServerErrorMessage(error: unknown) {
  if (isAxiosError<ServerResponse>(error) && error.response && error.response.status < 500 && error.response.data?.message)
    return error.response.data.message;

  return SOMETHING_WENT_WRONG;
}

export function isConversationOnline(conversation: Pick<Conversation, "members">, currentUserId?: string) {
  return conversation.members.some((member) => member.id !== currentUserId && member.status === UserStatus.ONLINE);
}

export function getGroupAvatarMembers(conversation: Pick<Conversation, "members">, currentUserId?: string) {
  const others = conversation.members.filter((member) => member.id !== currentUserId);
  const shown = others.find((member) => member.status === UserStatus.ONLINE) ?? others[0];

  return { shown, remainingCount: Math.max(others.length - 1, 0) };
}

export function getConversationName(conversation: Conversation, currentUserId?: string) {
  if (conversation.name) return conversation.name;

  const otherMemberNames = conversation.members
    .filter((member) => member.id !== currentUserId)
    .map(
      (member) => conversation.nicknames.find((nickname) => nickname.user === member.id)?.value || member.displayName,
    );

  if (conversation.isGroupChat && otherMemberNames.length === 0) return "Only you";
  if (conversation.isGroupChat && otherMemberNames.length === 1) return `You and ${otherMemberNames[0]}`;

  return otherMemberNames.join(", ");
}

type NicknameNoticeInput = {
  notice: MessageNotice;
  actorId: string;
  actorName: string;
  targetName: string;
  currentUserId?: string;
};

export function getNicknameNoticeParts({ notice, actorId, actorName, targetName, currentUserId }: NicknameNoticeInput) {
  const actor = actorId === currentUserId ? "You" : actorName;
  let target = `${targetName}'s`;
  if (notice.user === currentUserId) target = "your";
  else if (notice.user === actorId) target = "their own";

  return { actor, target, value: notice.value };
}

export function getNicknameNoticeText(input: NicknameNoticeInput) {
  const { actor, target, value } = getNicknameNoticeParts(input);

  return value ? `${actor} set ${target} nickname to ${value}` : `${actor} cleared ${target} nickname`;
}

export function isSameSender<T extends Pick<Message, "sender" | "notice">>(
  message: T | undefined,
  other?: Pick<Message, "sender" | "notice">,
): message is T {
  return Boolean(message && other && !message.notice && !other.notice && message.sender.id === other.sender.id);
}

export function setCachedNicknames(
  queryClient: QueryClient,
  { conversationId, userId }: { conversationId: string; userId?: string },
  update: (nicknames: Conversation["nicknames"]) => Conversation["nicknames"],
) {
  function apply<T extends Pick<Conversation, "id" | "nicknames">>(conversation: T): T {
    return conversation.id === conversationId ? { ...conversation, nicknames: update(conversation.nicknames) } : conversation;
  }

  queryClient.setQueryData<Conversation>(["conversation", conversationId], (prev) => prev && apply(prev));
  queryClient.setQueryData<Conversation[]>([userId, "conversations"], (prev) => prev?.map(apply));
  queryClient.setQueryData<Conversation[]>(["active", "conversations", userId], (prev) => prev?.map(apply));
}

export function getTimeIntervalText(dateCreated: Date) {
  const dateSent = new Date(dateCreated);
  const relativeDateInSeconds = Math.floor((Date.now() - dateSent.getTime()) / 1000);

  const time = new Intl.DateTimeFormat("en-US", { hour: "2-digit", minute: "2-digit" }).format(dateSent);

  if (relativeDateInSeconds > SECONDS_IN_YEAR)
    return (
      new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric", year: "numeric" }).format(dateSent) + " " + time
    );

  if (relativeDateInSeconds > SECONDS_IN_WEEK)
    return new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric" }).format(dateSent) + " " + time;

  if (relativeDateInSeconds > SECONDS_IN_DAY * 2)
    return new Intl.DateTimeFormat("en-US", { weekday: "long" }).format(dateSent) + " " + time;

  if (relativeDateInSeconds > SECONDS_IN_DAY) return "Yesterday, " + time;

  return time;
}

/** Whole seconds between two dates, regardless of which one is earlier. */
export function getSecondsInterval(firstDate: Date, secondDate: Date) {
  return Math.floor(Math.abs(firstDate.getTime() - secondDate.getTime()) / 1000);
}

/** Emits a socket event and resolves with the server's reply, throwing on `{ error }` or timeout. */
export async function emitSocketEventAndWaitForServerReply<E extends SocketEventWithServerReply>(
  socket: TypedSocket,
  event: E,
  payload: Parameters<ClientToServerEvents[E]>[0],
): Promise<ServerReplyOfSocketEvent<E>> {
  const timedSocket = socket.timeout(SOCKET_SERVER_REPLY_TIMEOUT_MS) as unknown as {
    emitWithAck: (event: E, payload: unknown) => Promise<unknown>;
  };
  const result = await timedSocket.emitWithAck(event, payload);
  if (result && typeof result === "object" && "error" in result) throw new Error(String(result.error));
  return result as ServerReplyOfSocketEvent<E>;
}

export function closeSession(session: CallSession) {
  session.sendTransport.close();
  session.recvTransport.close();
}

/** A readable message for a failed camera/microphone request. */
export function getMediaErrorMessage(error: unknown) {
  if (error instanceof DOMException) {
    if (error.name === "NotAllowedError") return "Camera access was blocked";
    if (error.name === "NotFoundError") return "No camera or microphone found";
    if (error.name === "NotReadableError") return "Camera is being used by another app";
    if (error.name === "OverconstrainedError") return "That camera is no longer available";
  }
  return "Could not start the camera";
}

export function readCallMediaPreferences(): CallMediaPreferences {
  try {
    const saved = JSON.parse(localStorage.getItem(CALL_MEDIA_PREFERENCES_STORAGE_KEY) ?? "{}");
    return {
      cameraId: typeof saved.cameraId === "string" ? saved.cameraId : undefined,
      microphoneId: typeof saved.microphoneId === "string" ? saved.microphoneId : undefined,
      isCameraOn: typeof saved.isCameraOn === "boolean" ? saved.isCameraOn : CALL_DEFAULT_MEDIA_PREFERENCES.isCameraOn,
      isMicOn: typeof saved.isMicOn === "boolean" ? saved.isMicOn : CALL_DEFAULT_MEDIA_PREFERENCES.isMicOn,
    };
  } catch {
    return CALL_DEFAULT_MEDIA_PREFERENCES;
  }
}

export function saveCallMediaPreferences(preferences: CallMediaPreferences) {
  try {
    localStorage.setItem(CALL_MEDIA_PREFERENCES_STORAGE_KEY, JSON.stringify(preferences));
  } catch {
    return;
  }
}

export function getInitials(name: string) {
  const words = name.split(/[^\p{L}\p{N}]+/u).filter(Boolean);
  if (words.length === 0) return "";

  const letters =
    words.length > 1
      ? [Array.from(words[0])[0], Array.from(words[words.length - 1])[0]]
      : Array.from(words[0]).slice(0, 2);

  return letters.join("").toUpperCase();
}

export function getAvatarColor(key: string) {
  let index = 0;
  for (const char of key) {
    const code = char.codePointAt(0) ?? 0;
    index = (index * 31 + code) % AVATAR_FALLBACK_COLORS.length;
  }

  return AVATAR_FALLBACK_COLORS[index];
}

export function getTileSize(tileCount: number) {
  const columns = Math.ceil(Math.sqrt(tileCount));
  const rows = Math.ceil(tileCount / columns);
  return {
    width: `calc((100% - ${columns - 1} * ${CALL_TILE_GAP}) / ${columns})`,
    height: `calc((100% - ${rows - 1} * ${CALL_TILE_GAP}) / ${rows})`,
  };
}

export function peopleLabel(count: number) {
  return `${count} ${count === 1 ? "person" : "people"}`;
}

export function othersLabel(count: number) {
  return `${count} ${count === 1 ? "other" : "others"}`;
}

/**
 * Prefixes a root-relative path with the app's base path (NEXT_PUBLIC_BASE_PATH,
 * e.g. "/croom"). Next applies basePath to <Link>, router and static imports,
 * but not to fetch() or URLs handed to third-party libraries.
 */
export function withBasePath(path: string) {
  return `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}${path}`;
}

export function createPendingMessage({
  conversationId,
  sender,
  text,
  photos,
  resending,
}: {
  conversationId: string;
  sender: User;
  text: string;
  photos: PhotoInput[];
  resending?: boolean;
}): CachedMessage {
  const id = `pending-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const now = new Date();

  return {
    id,
    clientKey: id,
    pending: true,
    resending,
    conversation: conversationId,
    sender,
    text,
    photos: photos.map((photo) => ({ ...photo, id: photo.key }) as unknown as Photo),
    seenBy: [],
    status: "",
    dateCreated: now,
    lastUpdated: now,
  } as unknown as CachedMessage;
}

export function appendMessage(pages: MessagePages | undefined, message: CachedMessage): MessagePages {
  if (!pages) return { pages: [{ pageParam: 1, result: [message] }], pageParams: [1] };

  return {
    ...pages,
    pages: pages.pages.map(({ pageParam, result }, index) => ({
      pageParam,
      result: index === pages.pages.length - 1 ? [...result, message] : result,
    })),
  };
}

export function replaceMessage(pages: MessagePages, id: string | undefined, message: CachedMessage): MessagePages {
  const isCached = Boolean(id) && pages.pages.some(({ result }) => result.some((cached) => cached.id === id));
  if (!isCached) return appendMessage(pages, message);

  return {
    ...pages,
    pages: pages.pages.map(({ pageParam, result }) => ({
      pageParam,
      result: result.map((cached) => (cached.id === id ? message : cached)),
    })),
  };
}

export function removeMessage(pages: MessagePages, id: string): MessagePages {
  return {
    ...pages,
    pages: pages.pages.map(({ pageParam, result }) => ({
      pageParam,
      result: result.filter((cached) => cached.id !== id),
    })),
  };
}

export function toPhotoInputs(photos: Photo[]): PhotoInput[] {
  return photos.map(({ key, url, width, height }) => ({ key, url, width, height }));
}

export function markMessageFailed(pages: MessagePages, id: string): MessagePages {
  return {
    ...pages,
    pages: pages.pages.map(({ pageParam, result }) => ({
      pageParam,
      result: result.map((cached) => (cached.id === id ? { ...cached, pending: false, failed: true } : cached)),
    })),
  };
}
