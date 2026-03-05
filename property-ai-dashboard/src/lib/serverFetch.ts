import { getServerApiBase } from "@/lib/serverApi";

const API = getServerApiBase();

export async function serverFetch<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    cache: "no-store",
    ...options,
  });

  if (res.status === 404) {
    throw new Error("NOT_FOUND");
  }

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API_ERROR ${res.status}: ${text}`);
  }

  return res.json();
}
