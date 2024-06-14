import { useSession } from "next-auth/react";
import { useEffect, useRef } from "react";

let websocket_instance: WebSocket | null = null;

export function useWebsocket() {
  const server_url = process.env.NEXT_PUBLIC_DEVELOPMENT_WEBSOCKET_SERVER!;
  if (!server_url)
    throw new Error(
      "NEXT_PUBLIC_DEVELOPMENT_WEBSOCKET_SERVER is missing from your .env.local file"
    );
  const { data } = useSession();

  const websocket_ref = useRef<WebSocket>();

  useEffect(() => {
    if (!data) return;
    if (!websocket_instance)
      websocket_instance = new WebSocket(
        server_url + "?user_id=" + data?.user.id
      );
    websocket_ref.current = websocket_instance;
  }, [data]);

  return websocket_ref.current;
}
