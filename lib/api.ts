const TOKEN_KEY = "terraloop_token"

export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers)
  if (options.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json")
  }
  if (typeof window !== "undefined") {
    const token = localStorage.getItem(TOKEN_KEY)
    if (token) headers.set("Authorization", `Bearer ${token}`)
  }

  const response = await fetch(path, { ...options, headers })
  const data: unknown = await response.json().catch(() => null)
  if (!response.ok) {
    const message = typeof data === "object" && data !== null && "error" in data && typeof data.error === "string"
      ? data.error
      : "Something went wrong. Please try again."
    throw new Error(message)
  }
  return data as T
}
