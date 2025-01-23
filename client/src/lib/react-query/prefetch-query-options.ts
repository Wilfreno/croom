import { FetchQueryOptions } from "@tanstack/react-query";
import { GETRequest, ServerResponse } from "../server/requests";
import { Block, Conversation } from "../types/server-data-types";

export function getConvoOptions(
  id: string
): FetchQueryOptions<ServerResponse<Conversation | Block>> {
  return {
    queryKey: ["conversation", id],
    queryFn: async () => {
      try {
        const response = await GETRequest<Conversation>("/v1/conversation/" + id);

        return response;
      } catch (error) {
        throw error;
      }
    },
    retry: false,
  };
}
