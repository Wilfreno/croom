import type { CallSession } from "@/types/call.types";
import type { ServerReplyOfSocketEvent, SocketEventWithServerReply, TypedSocket } from "@/types/socket.types";
import { SECONDS_IN_DAY, SECONDS_IN_WEEK, SECONDS_IN_YEAR, SOCKET_SERVER_REPLY_TIMEOUT_MS } from "@repo/constants";
import { UserStatus } from "@repo/enums";
import type { ClientToServerEvents } from "@repo/types";
import { Conversation } from "@repo/types";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Whether the conversation has more than one member besides the current user. Conversation lists
 * leave the current user out of `members` but a single conversation includes them, so pass
 * `currentUserId` to count both the same way.
 */
export function isGroupChat(conversation: Pick<Conversation, "members">, currentUserId?: string) {
  return conversation.members.filter((member) => member.id !== currentUserId).length > 1;
}

export function isConversationOnline(conversation: Pick<Conversation, "members">, currentUserId?: string) {
  return conversation.members.some((member) => member.id !== currentUserId && member.status === UserStatus.ONLINE);
}

/**
 * The member to show on a group chat's avatar (the first other member who is online, else the
 * first other member) and how many other members there are besides them.
 */
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
