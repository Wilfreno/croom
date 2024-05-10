export type ServerResponse = {
  status:
    | "OK"
    | "NOT_FOUND"
    | "INTERNAL_SERVER_ERROR"
    | "CONFLICT"
    | "BAD_REQUEST";
  message: string;
  data: unknown;
};
