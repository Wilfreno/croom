export function isGroupChat(members: readonly unknown[]) {
  return members.length > 2;
}
