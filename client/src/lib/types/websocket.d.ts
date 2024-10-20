import {
  AppData,
  DtlsParameters,
  IceCandidate,
  IceParameters,
  MediaKind,
  RtpParameters,
} from "mediasoup-client/lib/types";
import { Message, Notification } from "./server-response-data";

export type WebSocketMessage = {
  type: WebsocketPayloadType;
  payload: WebSocketPayload;
};

export type WebSocketPayload =
  | string
  | UserLobbyPayload
  | Message
  | Notification
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

export type UserLobbyPayload = {
  user_id: string;
  lobby_id: string;
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

export type DtlsParametersPayload = {
  user_id: string;
  dtlsParameters: DtlsParameters;
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
