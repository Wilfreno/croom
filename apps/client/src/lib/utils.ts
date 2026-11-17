import type { CallSession } from "@/types/call.types";
import type { CachedMessage, MessagePages, PhotoInput } from "@/types/message.types";
import type { ServerReplyOfSocketEvent, SocketEventWithServerReply, TypedSocket } from "@/types/socket.types";
import { SECONDS_IN_DAY, SECONDS_IN_WEEK, SECONDS_IN_YEAR, SOCKET_SERVER_REPLY_TIMEOUT_MS } from "@repo/constants";
import { ConversationStatus, UserStatus } from "@repo/enums";
import type { ClientToServerEvents } from "@repo/types";
import { Conversation } from "@repo/types";
import type { Photo, ServerResponse, User } from "@repo/types";
import { isAxiosError } from "axios";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function isGroupChat(conversation: Pick<Conversation, "members">, currentUserId?: string) {
  return conversation.members.filter((member) => member.id !== currentUserId).length > 1;
}

export function isBlockedMember(conversation: Pick<Conversation, "status" | "blocker"> | undefined, currentUserId?: string) {
  return conversation?.status === ConversationStatus.BLOCKED && conversation.blocker !== currentUserId;
}

export function isBlockedError(error: unknown) {
  return isAxiosError<ServerResponse>(error) && error.response?.data?.status === "BLOCKED";
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

  return conversation.members
    .filter((member) => member.id !== currentUserId)
    .map(
      (member) => conversation.nicknames.find((nickname) => nickname.user === member.id)?.value || member.displayName,
    )
    .join(", ");
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

export function peopleLabel(count: number) {
  return `${count} ${count === 1 ? "person" : "people"}`;
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
