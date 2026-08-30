import type { ServerResponse } from "@repo/types";

export type { ServerResponse };

const serverUrl = process.env.NEXT_PUBLIC_SERVER!;
function pathChecker(path: string) {
  if (!path.startsWith("/")) throw new Error("path must start with /");
}

async function responseJSON<T>(response: Response) {
  try {
    const responseJson = (await response.json()) as ServerResponse<T>;

    return responseJson;
  } catch (error) {
    throw error;
  }
}

/**
 *  Sends a POST request to the specified path with the provided body.
 * @param path  The path on which the request is sent. The `server domain` is `unnecessary`.
 * @param body  The body of the http request
 * @returns {Promise<ServerResponse<R>>}  An `object` containing `status`, `message` and, `data`
 * @see {@link ServerResponse}  For the type structure
 * @example
 *  const {status , message, data} = await POSTRequest("/v1/user", { id: 123 })
 */
export async function POSTRequest<R>(
  path: string,
  body?: object
): Promise<ServerResponse<R>> {
  try {
    pathChecker(path);

    const response = await fetch(serverUrl + path, {
      method: "POST",
      headers: body
        ? {
            "Content-Type": "application/json",
          }
        : undefined,
      body: body && JSON.stringify(body),
      credentials: "include",
    });

    return await responseJSON(response);
  } catch (error) {
    throw error;
  }
}

/**
 * Sends a GET request to the specified URL with optional query parameters.
 * @param {string} path  The path on which the request is sent. The `server domain` is `unnecessary`.
 * @param {T} query_params `(optional)` the query parameter of the url represented as an object
 * @returns {Promise<ServerResponse<R>>}  An `object` containing `status`, `message` and, `data`
 * @see {@link ServerResponse} For the type structure
 * @example
 *  const {status , message, data} = await http_request.GET("/v1/user")
 *
 *  const {status , message, data} = await http_request.GET("/v1/user", { id: 123 }) // the path will become /v1/user?id=123
 */
export async function GETRequest<R>(
  path: string,
  queryParams?: Record<string, string>
): Promise<ServerResponse<R>> {
  try {
    pathChecker(path);
    let request = path;
    if (queryParams) request += "?" + new URLSearchParams(queryParams).toString();

    const response = await fetch(serverUrl + request, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    });

    return await responseJSON(response);
  } catch (error) {
    throw error;
  }
}
/**
 *  Sends a PATCH request to the specified path with the provided body.
 * @param {string} path  The path on which the request is sent. The `server domain` is `unnecessary`.
 * @param {T} body  The body of the http request
 * @returns {Promise<ServerResponse<R>>}  An `object` containing `status`, `message` and, `data`
 * @see {@link ServerResponse}  For the type structure
 * @example
 *  const {status , message, data} = await POSTRequest("/v1/user", { id: 123 })
 */
export async function PATCHRequest<R>(
  path: string,
  body?: object
): Promise<ServerResponse<R>> {
  try {
    pathChecker(path);

    const response = await fetch(serverUrl + path, {
      method: "PATCH",
      headers: body
        ? {
            "Content-Type": "application/json",
          }
        : undefined,

      body: JSON.stringify(body),
      credentials: "include",
    });

    return await responseJSON(response);
  } catch (error) {
    throw error;
  }
}
/**
 *  Sends a DELETE request to the specified path with the provided body.
 * @param {string} path  The path on which the request is sent. The `server domain` is `unnecessary`.
 * @param {T} body  The body of the http request
 * @returns {Promise<ServerResponse<R>>}  An `object` containing `status`, `message` and, `data`
 * @see {@link ServerResponse}  For the type structure
 * @example
 *
 *  const {status , message, data} = await DELETERequest("/v1/user", { id: 123 })
 */
export async function DELETERequest<R>(
  path: string,
  body?: object
): Promise<ServerResponse<R>> {
  try {
    pathChecker(path);

    const response = await fetch(serverUrl + path, {
      method: "DELETE",
      headers: body
        ? {
            "Content-Type": "application/json",
          }
        : undefined,

      body: JSON.stringify(body),
      credentials: "include",
    });

    return await responseJSON(response);
  } catch (error) {
    throw error;
  }
}
