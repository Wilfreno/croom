import { nightOwl } from "@react-email/components";

type HTTPStatusResponse =
  | "OK"
  | "NOT_FOUND"
  | "INTERNAL_SERVER_ERROR"
  | "CONFLICT"
  | "BAD_REQUEST"
  | "UNAUTHORIZED";

export function JSONResponse<T>(
  status: HTTPStatusResponse,
  message: string,
  data: T | null = null
) {
  return {
    status,
    message,
    data,
  };
}
