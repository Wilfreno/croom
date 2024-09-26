import { GETRequest } from "@/lib/server/requests";
import { Lobby } from "@/lib/types/server";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { toast } from "sonner";

export default function LobbyFooter() {
  const params = useParams<{ id: string }>();
  const { data: lobby } = useQuery({
    queryKey: ["lobby", params.id],
    queryFn: async () => {
      const { data, message, status } = await GETRequest<Lobby>(
        "/v1/lobby/" + params.id
      );

      if (status !== "OK") {
        toast(message);
        throw new Error(message);
      }

      return data;
    },
  });

  return (
    <header className="w-full h-full flex items-center px-10">
      <h1 className="tex-4xl font-semibold">{lobby?.name}</h1>
    </header>
  );
}
