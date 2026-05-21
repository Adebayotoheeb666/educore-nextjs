// Enhanced fetch that automatically includes the auth token from localStorage
export async function authenticatedFetch(
  url: string,
  options?: RequestInit
): Promise<Response> {
  const headers = new Headers(options?.headers);

  // Add Authorization header if token exists in localStorage
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("accessToken");
    if (token && !headers.has("Authorization")) {
      headers.set("Authorization", `Bearer ${token}`);
    }
  }

  return fetch(url, {
    ...options,
    headers,
    credentials: "include", // Always include cookies
  });
}
