import { useSession } from "next-auth/react";
import { useEffect, useRef } from "react";

let websocket: WebSocket | null = null;

export default function useWebsocket() {
  const server_url = process.env.NEXT_PUBLIC_DEVELOPMENT_WEBSOCKET_SERVER!;
  if (!server_url)
    throw new Error(
      "NEXT_PUBLIC_DEVELOPMENT_WEBSOCKET_SERVER is missing from your .env.local file"
    );
  const { data } = useSession();

  const websocket_ref = useRef<WebSocket>();

  useEffect(() => {
    if (!data) return;
    if (!websocket)
      websocket = new WebSocket(server_url + "?user_id=" + data?.user.id);
    websocket_ref.current = websocket;
  }, [data]);

  return websocket_ref.current;
}
