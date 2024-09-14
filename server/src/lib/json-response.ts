type ResponseStatus =
  | "OK"
  | "UNAUTHORIZED"
  | "NOT_FOUND"
  | "INTERNAL_SERVER_ERROR"
  | "CONFLICT"
  | "FORBIDDEN"
  | "BAD_REQUEST"
  | "CREATED";

/**
 *
 *  Constructs a JSON for a uniform format of response.
 *
 *
 * @param {ResponseStatus} status - string form of the status code
 * @param message - response message
 * @param data - the result of the requested data
 *
 * @returns {object}
 *
 * @requires fastifyReply as `reply`
 * @example
 *
 *  return reply.code(200).send(JSONResponse("OK", "request successful", data))
 *
 *  // the message has a default value that corresponds the 500 code error
 *  return reply.code(500).send(JSONResponse("EXTERNAL_SERVER_ERROR"))
 *
 *
 */

export default function JSONResponse<T>(
  status: ResponseStatus,
  message: string = "oops! something went wrong",
  data: T | null = null
): object {
  return {
    status,
    message: message ? message.toLocaleLowerCase() : null,
    data,
  };
}
