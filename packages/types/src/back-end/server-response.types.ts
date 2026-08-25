export type ServerResponseStatus =
  | "OK"
  | "UNAUTHORIZED"
  | "NOT_FOUND"
  | "INTERNAL_SERVER_ERROR"
  | "CONFLICT"
  | "FORBIDDEN"
  | "BAD_REQUEST"
  | "CREATED"
  | "OUT_OF_BOUND"
  | "BLOCKED";

export type ServerResponse<T = null> = {
  status: ServerResponseStatus;
  message: string;
  data: T;
};
