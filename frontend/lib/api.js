const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export async function apiFetch(path, options = {}) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  const response = await fetch(`${API_BASE_URL}${normalizedPath}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    credentials: "include",
  });

  if (!response.ok) {
    let backendError = "Request failed.";

    try {
      const errorPayload = await response.json();
      if (errorPayload?.error) {
        backendError = errorPayload.error;
      }
    } catch (_error) {
      backendError = response.statusText || backendError;
    }

    throw new Error(`API error (${response.status}): ${backendError}`);
  }

  return response.status === 204 ? null : response.json();
}
