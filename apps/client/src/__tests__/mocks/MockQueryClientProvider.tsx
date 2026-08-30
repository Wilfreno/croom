import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";

export default function MockQueryClientProvider({ children, queryClient }: { children: React.ReactNode; queryClient: QueryClient }) {
  queryClient.setQueryData(["signup", "form"], {
    email: "",
    username: "",
    password: "",
    displayName: "",
    confirmPassword: "",
    pin: "",
  });

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
