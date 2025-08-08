// Safe API wrapper for GET, POST, PUT, DELETE

export interface ApiFetchOptions {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  headers?: Record<string, string>;
  body?: any;
  [key: string]: any;
}

export async function apiFetch(
  url: string,
  options: ApiFetchOptions = {}
): Promise<any> {
  if (typeof fetch === "undefined") {
    throw new Error(
      "apiFetch: fetch is undefined. Ensure this runs in a browser or Node.js environment."
    );
  }
  const method = options.method || "GET";
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };
  const body = options.body ? JSON.stringify(options.body) : undefined;
  try {
    const response = await fetch(url, { ...options, method, headers, body });
    const text = await response.text();
    let data;
    try {
      data = text ? JSON.parse(text) : null;
    } catch (jsonErr) {
      console.error("apiFetch: Failed to parse JSON", jsonErr, text);
      throw new Error("Invalid JSON response");
    }
    if (!response.ok) {
      console.error("apiFetch: API error", response.status, data);
      throw new Error(data?.message || `API error: ${response.status}`);
    }
    return data;
  } catch (err) {
    console.error("apiFetch: Network or server error", err);
    throw err;
  }
}
