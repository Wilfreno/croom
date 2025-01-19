import { FetchQueryOptions } from "@tanstack/react-query";
import { GETRequest } from "../server/requests";
import { Conversation } from "../types/server-data-types";

export function getConvoOptions(id: string): FetchQueryOptions<Conversation> {
  return {
    queryKey: ["conversation", id],
    queryFn: async () => {
      try {
        const { data, message, status } = await GETRequest<Conversation>(
          "/v1/conversation/" + id
        );

        if (status !== "OK") throw new Error(message);

        return data;
      } catch (error) {
        throw error;
      }
    },
    retry: false,
  };
}
