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
    "Cache-Control": "no-cache",
    Pragma: "no-cache",
    ...(options.headers || {}),
  };
  // Avoid double JSON encoding: if caller already passed a string, send as-is
  let body: any = undefined;
  if (options.body !== undefined) {
    if (typeof options.body === "string") {
      // Heuristic: if it looks like already JSON (starts with {,[, or "), don't stringify again
      const trimmed = options.body.trim();
      if (
        trimmed.startsWith("{") ||
        trimmed.startsWith("[") ||
        trimmed.startsWith('"')
      ) {
        body = options.body;
      } else {
        // Non-JSON string payload; still send raw
        body = options.body;
      }
    } else {
      body = JSON.stringify(options.body);
    }
  }
  try {
    const response = await fetch(url, {
      cache: "no-store",
      ...options,
      method,
      headers,
      body,
    });
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

// Provide a default export for compatibility with legacy imports
export default apiFetch;
