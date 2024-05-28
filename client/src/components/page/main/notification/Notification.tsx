import auth_options from "@/lib/auth-options";
import { NotificationType } from "@/lib/types/notification-type";
import { ServerResponse } from "@/lib/types/sever-response";
import { getServerSession } from "next-auth";
import NotificationList from "./NotificationList";

async function getNotifications(user_id: string): Promise<NotificationType[]> {
  const server_url = process.env.NEXT_PUBLIC_DEVELOPMENT_SERVER!;
  if (!server_url)
    throw new Error(
      "NEXT_PUBLIC_DEVELOPMENT_SERVER is missing from your .env.local file"
    );

  const response = await fetch(server_url + "/get/notification/" + user_id);

  const response_json = (await response.json()) as ServerResponse;

  if (response_json.status === "OK")
    return response_json.data as NotificationType[];
  return [];
}

export default async function Notification() {
  const session = await getServerSession(auth_options);

  let notifications: NotificationType[] = [];
  if (session) notifications = await getNotifications(session?.user.id!);


  return <NotificationList server_notifications={notifications} />;
}
