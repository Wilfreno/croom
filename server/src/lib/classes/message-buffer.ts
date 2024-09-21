import { MessagePayload } from "../types/websocket-types";

export default class MessageBuffer {
  size: number;
  buffer: Map<string, MessagePayload | null>;
  oldest: string;

  constructor(messages: MessagePayload[]) {
    this.size = 20;

    if (messages.length > this.size)
      throw new Error("maximum capacity reached; maximum capacity is 20");

    this.buffer = new Map<string, MessagePayload | null>();

    messages.forEach((message) => {
      this.buffer.set(message.id, message);
    });

    this.oldest = this.buffer.keys().next().value || "";
  }

  insert(message: MessagePayload) {
    if (this.buffer.size === this.size) {
      this.buffer.delete(this.oldest);
      this.oldest = this.buffer.keys().next().value!;
    }

    this.buffer.set(message.id, message);
  }

  delete(message_id: string) {
    this.buffer.set(message_id, null);
  }

  read() {
    return Array.from(this.buffer.values());
  }
}
