// Enhanced fetch that automatically includes the auth token from localStorage
export async function authenticatedFetch(
  url: string,
  options?: RequestInit
): Promise<Response> {
  const newOptions: RequestInit = {
    ...options,
    credentials: "include", // Always include cookies for httpOnly token
  };

  // Add Authorization header if token exists in localStorage
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("accessToken");
    if (token) {
      newOptions.headers = new Headers(options?.headers);
      (newOptions.headers as Headers).set("Authorization", `Bearer ${token}`);
    }
  }

  return fetch(url, newOptions);
}
