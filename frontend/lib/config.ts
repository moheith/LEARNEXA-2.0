const configuredApiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

export function getApiBaseUrl(): string {
  if (typeof window !== "undefined") {
    const hostname = window.location.hostname;
    const isLocalHost = hostname === "localhost" || hostname === "127.0.0.1";

    if (!isLocalHost) {
      return `http://${hostname}:5000/api`;
    }
  }

  return configuredApiBaseUrl || "http://127.0.0.1:5000/api";
}
