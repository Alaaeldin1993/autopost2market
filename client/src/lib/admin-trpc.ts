import { createTRPCReact, httpBatchLink } from "@trpc/react-query";
import type { AppRouter } from "../../../server/routers";
import superjson from "superjson";

export const adminTrpc = createTRPCReact<AppRouter>();

export function getAdminTrpcClient() {
  const token = localStorage.getItem("adminToken");
  
  return adminTrpc.createClient({
    links: [
      httpBatchLink({
        url: "/api/trpc",
        transformer: superjson,
        headers() {
          return {
            authorization: token ? `Bearer ${token}` : "",
          };
        },
      }),
    ],
  });
}
