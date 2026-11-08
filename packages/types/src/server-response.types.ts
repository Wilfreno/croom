export type ServerResponseStatus =
  | 'OK'
  | 'UNAUTHORIZED'
  | 'NOT FOUND'
  | 'INTERNAL SERVER ERROR'
  | 'CONFLICT'
  | 'FORBIDDEN'
  | 'BAD REQUEST'
  | 'CREATED'
  | 'OUT OF BOUND'
  | 'BLOCKED'
  | 'TOO MANY REQUESTS';

export type ServerResponse<T = null> = {
  status: ServerResponseStatus;
  message: string;
  data: T;
};

export const RESPONSE_PAYLOAD = Symbol('server_response:payload');

export type ResponsePayload<T> = {
  [RESPONSE_PAYLOAD]: true;
  status?: ServerResponseStatus;
  message?: string;
  data: T;
};

export type ResponseOptions = {
  status?: ServerResponseStatus;
  message?: string;
};
