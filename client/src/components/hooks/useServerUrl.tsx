export default function useServerUrl() {
  const server_url = process.env.NEXT_PUBLIC_DEVELOPMENT_SERVER!;
  if (!server_url)
    throw new Error(
      "NEXT_PUBLIC_DEVELOPMENT_SERVER is missing from your .env.local file"
    );

  return server_url;
}
