import { MediaKind, RtpCapabilities } from "mediasoup/node/lib/RtpParameters";
import { DtlsParameters } from "mediasoup/node/lib/types";
import { Server } from "socket.io";

declare module "fastify" {
  interface FastifyInstance {
    io: Server<ClientToServer, ServerToCLient>;
  }
}

export type ClientToServer = {
  JOIN_ROOM: (
    data: { user_id: string; lobby_id: string },
    callback: (data: RtpCapabilities) => Promise<void>
  ) => void;
  CREATE_SEND_TRANSPORT: (
    data: { user_id: string; lobby_id: string },
    callback: (data: {
      id: string;
      iceParameters: IceParameters;
      iceCandidates: IceCandidate[];
      dtlsParameters: DtlsParameters;
    }) => Promise<void>
  ) => void;
  CONNECT_SEND_TRANSPORT: ({
    user_id: string,
    dtls_parameters: DtlsParameters,
  }) => void;

  CREATE_PRODUCER: (
    data: { user_id: string; lobby_id: string },
    parameters: {
      kind: MediaKind;
      rtpParameters: RtpParameters;
      appData: AppData;
    },
    callback: (data: { id: string; producers_are_available: boolean }) => void
  ) => void;

  GET_PRODUCERS: (
    data: { user_id: string; lobby_id: string },
    callback: (ids: string[]) => void
  ) => void;

  CREATE_RECEIVE_TRANSPORT: (
    data: { user_id: string },
    callback: (data: {
      id: string;
      iceParameters: IceParameters;
      iceCandidates: IceCandidate[];
      dtlsParameters: DtlsParameters;
    }) => void
  ) => void;
  CONNECT_RECEIVE_TRANSPORT: ({
    user_id: string,
    dtls_parameters: DtlsParameters,
  }) => void;

  CONSUME: (
    data: {
      rtp_capabilities: RtpCapabilities;
      producer_id: string;
      user_id: string;
    },
    callback: (data: {
      id: consumer.id;
      producer_id: string;
      kind: MediaKind;
      rtp_parameters: RtpParameters;
      owner_id: string;
    }) => Promise<void>
  ) => void;
};

export type ServerToCLient = {
  ERROR: (data: string) => void;
  PRODUCER_CLOSED: (owner_id: string) => void;
  SEND_MESSAGE: (message: MessagePayload) => void;
  DELETE_MESSAGE: (message: MessagePayload) => void;
  NOTIFICATION: (notification: WebsocketNotification) => void;
};

export interface MessagePayload extends Message {
  status: "UPDATED" | "DELETED";
  id: string;
  lobby: Lobby;
  sender: User;
}

export interface WebsocketNotification extends Omit<Notification, "receiver"> {
  receiver: string;
}
