import { Message } from "../database/models/Message";
import { Lobby } from "../database/models/Lobby";
import { User } from "../database/models/User";
import { Notification } from "src/database/models/Notification";
import { MediaKind, RtpCapabilities } from "mediasoup/node/lib/RtpParameters";
import { DtlsParameters } from "mediasoup/node/lib/types";

export type WebSocketMessage = {
  type: WebsocketPayloadType;
  payload: WebSocketPayload;
};

export type WebSocketPayload =
  | string
  | UserLobbyPayload
  | MessagePayload
  | WebsocketNotification
  | RtpCapabilities
  | TransportParamsPayload
  | DtlsParametersPayload
  | ProducerParamsPayload
  | RtpCapabilitiesPayload;

export type WebsocketPayloadType =
  | "JOIN_LOBBY"
  | "RTP_CAPABILITIES"
  | "GET_TRANSPORT_PARAMS"
  | "TRANSPORT_PARAMS"
  | "CONNECT_SENDER_TRANSPORT"
  | "CONNECT_RECEIVER_TRANSPORT"
  | "CREATE_PRODUCER"
  | "PRODUCER_ID"
  | "CONSUME"
  | "CONSUME_VIDEO"
  | "CONSUME_AUDIO"
  | "RESUME_VIDEO_CONSUMER"
  | "RESUME_AUDIO_CONSUMER"
  | "LEAVE_LOBBY"
  | "SEND_MESSAGE"
  | "DELETE_MESSAGE"
  | "NOTIFICATION"
  | "ERROR"
  | "RESTART_CLIENT";

export interface MessagePayload extends Message {
  status: "UPDATED" | "DELETED";
  id: string;
  lobby: Lobby;
  sender: User;
}

export type UserLobbyPayload = {
  user_id: string;
  lobby_id: string;
};

export interface WebsocketNotification extends Omit<Notification, "receiver"> {
  receiver: string;
}

export type DtlsParametersPayload = {
  user_id: string;
  dtlsParameters: DtlsParameters;
};

type TransportParams = {
  id: string;
  iceParameters: IceParameters;
  iceCandidates: IceCandidate[];
  dtlsParameters: DtlsParameters;
};
export type TransportParamsPayload = {
  sender: TransportParams;
  receiver: TransportParams;
};

export type ProducerPayload = {
  user_id: string;
  params: {
    kind: MediaKind;
    rtpParameters: RtpParameters;
    appData: AppData;
  };
};

export type RtpCapabilitiesPayload = {
  user_id: string;
  lobby_id: string;
  rtpCapabilities: RtpCapabilities;
};

export type ConsumerPayload = {
  owner: string;
  kind: MediaKind;
  id: string;
  producer_id: string;
  rtpParameters: RtpParameters;
};
