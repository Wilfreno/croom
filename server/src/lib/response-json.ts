type HTTPStatusResponse =
  | "OK"
  | "NOT_FOUND"
  | "INTERNAL_SERVER_ERROR"
  | "CONFLICT"
  | "BAD_REQUEST"
  | "UNAUTHORIZED";

export function responseWithData<T>(
  status: HTTPStatusResponse,
  message: string,
  data: T
) {
  return {
    status,
    message,
    data,
  };
}

export function responseWithoutData(
  status: HTTPStatusResponse,
  message: string
) {
  return {
    status,
    message,
  };
}
