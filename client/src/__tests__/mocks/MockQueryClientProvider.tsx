import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";

export default function MockQueryClientProvider({ children, query_client }: { children: React.ReactNode; query_client: QueryClient }) {
  query_client.setQueryData(["signup", "form"], {
    email: "",
    username: "",
    password: "",
    display_name: "",
    confirm_password: "",
    pin: "",
  });

  return <QueryClientProvider client={query_client}>{children}</QueryClientProvider>;
}
