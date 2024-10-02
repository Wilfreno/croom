import LobbyPage from "@/components/page/lobby/Lobby";
import { GETRequest } from "@/lib/server/requests";
import { Lobby } from "@/lib/types/server";
import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from "@tanstack/react-query";

export default async function page({ params }: { params: { id: string } }) {
  const query_client = new QueryClient();

  await query_client.prefetchQuery({
    queryKey: ["lobby", params.id],
    queryFn: async () => {
      const { data, message, status } = await GETRequest<Lobby>(
        "/v1/lobby/" + params.id
      );

      if (status !== "OK") {
        throw new Error(message);
      }

      return data;
    },
  });
  return (
    <HydrationBoundary state={dehydrate(query_client)}>
      <LobbyPage />
    </HydrationBoundary>
  );
}
