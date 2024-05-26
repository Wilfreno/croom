import { useEffect, useRef } from "react";

let websocket: WebSocket | null = null;

export default function useWebsocket(user_id: string) {
  const server_url = process.env.NEXT_PUBLIC_DEVELOPMENT_WEBSOCKET_SERVER!;
  if (!server_url)
    throw new Error(
      "NEXT_PUBLIC_DEVELOPMENT_WEBSOCKET_SERVER is missing from your .env.local file"
    );

  const websocket_ref = useRef<WebSocket>();
  useEffect(() => {
    if (!user_id) return;
    if (!websocket)
      websocket = new WebSocket(server_url + "?user_id=" + user_id);
    websocket_ref.current = websocket;
  }, [user_id]);

  return websocket_ref.current;
}
