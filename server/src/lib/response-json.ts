type HTTPResponse = {
  status:
    | "OK"
    | "NOT_FOUND"
    | "INTERNAL_SERVER_ERROR"
    | "CONFLICT"
    | "BAD_REQUEST"
    | "UNAUTHORIZED";
  message: string | Error;
  data: unknown;
};

export function okStatus<T>(
  message: string,
  data: T
): HTTPResponse & { data: T } {
  return {
    status: "OK",
    message,
    data,
  };
}

export function notFoundStatus(message: string): HTTPResponse {
  return {
    status: "NOT_FOUND",
    message,
    data: null,
  };
}

export function serverError(): HTTPResponse {
  return {
    status: "INTERNAL_SERVER_ERROR",
    message: "something went wrong",
    data: null,
  };
}

export function serverConflict(message: string): HTTPResponse {
  return {
    status: "CONFLICT",
    message,
    data: null,
  };
}

export function badRequest(message?: string): HTTPResponse {
  return {
    status: "BAD_REQUEST",
    message: message ? message : "Something went wrong",
    data: null,
  };
}

export function unauthorized(message: string): HTTPResponse {
  return {
    status: "UNAUTHORIZED",
    message,
    data: null,
  };
}
