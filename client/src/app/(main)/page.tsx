  "use client";
  import { Button } from "@/components/ui/button";
  import { GETRequest, POSTRequest } from "@/lib/server/requests";
  import { useSession } from "next-auth/react";
  export default function Home() {
    const { data } = useSession();
    async function storeToken() {
      const response = await POSTRequest("/v1/user/session", {
        id: data?.user!.id,
      });
      console.log("SESSION::", response);
    }

    async function sendToServer() {
      const response = await POSTRequest("/test");
      console.log("TEST::", response);
    }

    return (
      data && (
        <div>
          <Button onClick={storeToken}>Create session</Button>
          <Button onClick={sendToServer}>test</Button>
        </div>
      )
    );
  }
