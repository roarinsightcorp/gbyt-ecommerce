
const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://127.0.0.1:8000/api/v1";

export interface ApiError {
  detail?: string;
  code?: string;
  [key: string]: unknown;
}

export class ApiRequestError extends Error {
  status: number;
  data: ApiError | null;

  constructor(
    message: string,
    status: number,
    data: ApiError | null = null
  ) {
    super(message);
    this.name = "ApiRequestError";
    this.status = status;
    this.data = data;
  }
}

interface RequestOptions extends RequestInit {
  /**
   * Whether this request requires authentication.
   *
   * Authentication itself is handled by HttpOnly cookies.
   * JavaScript never reads the JWT.
   */
  auth?: boolean;

  /**
   * Whether this request should include a CSRF token.
   *
   * Unsafe methods such as POST/PATCH/DELETE should normally
   * use CSRF protection when cookie authentication is involved.
   */
  csrf?: boolean;
}

let csrfToken: string | null = null;

let csrfRequest: Promise<string> | null = null;

/**
 * Fetch a CSRF token from Django.
 *
 * The backend also sets the csrftoken cookie.
 */
async function getCsrfToken(): Promise<string> {
  if (csrfToken) {
    return csrfToken;
  }

  if (csrfRequest) {
    return csrfRequest;
  }

  csrfRequest = fetch(
    `${API_URL}/auth/csrf/`,
    {
      method: "GET",
      credentials: "include",
      headers: {
        Accept: "application/json",
      },
    }
  )
    .then(async (response) => {
      if (!response.ok) {
        throw new ApiRequestError(
          `Failed to obtain CSRF token (${response.status})`,
          response.status
        );
      }

      const data = (await response.json()) as {
        csrfToken?: string;
      };

      if (!data.csrfToken) {
        throw new Error(
          "Django did not return a CSRF token."
        );
      }

      csrfToken = data.csrfToken;

      return data.csrfToken;
    })
    .finally(() => {
      csrfRequest = null;
    });

  return csrfRequest;
}

/**
 * Clear the cached CSRF token.
 *
 * This is useful after authentication/session changes
 * or if Django rotates the CSRF token.
 */
export function clearCsrfToken(): void {
  csrfToken = null;
}

/**
 * Determine whether the request uses an unsafe HTTP method.
 */
function requiresCsrf(method?: string): boolean {
  const normalizedMethod =
    method?.toUpperCase() || "GET";

  return ![
    "GET",
    "HEAD",
    "OPTIONS",
    "TRACE",
  ].includes(normalizedMethod);
}

export async function apiRequest<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const {
    auth = false,
    csrf,
    headers,
    ...requestOptions
  } = options;

  const method =
    requestOptions.method?.toUpperCase() || "GET";

  const shouldSendCsrf =
    csrf ?? requiresCsrf(method);

  const requestHeaders = new Headers(headers);

  requestHeaders.set(
    "Accept",
    "application/json"
  );

  if (requestOptions.body !== undefined) {
    requestHeaders.set(
      "Content-Type",
      "application/json"
    );
  }

  /**
   * Cookie authentication.
   *
   * This is the critical security change.
   *
   * The browser sends:
   *
   *   gbyt_access
   *   gbyt_refresh
   *
   * automatically.
   *
   * JavaScript never gets access to either JWT.
   */
  const fetchOptions: RequestInit = {
    ...requestOptions,
    method,
    headers: requestHeaders,
    credentials: "include",
  };

  /**
   * Django CSRF protection.
   *
   * Only unsafe requests need the X-CSRFToken header.
   */
  if (shouldSendCsrf) {
    const token = await getCsrfToken();

    requestHeaders.set(
      "X-CSRFToken",
      token
    );
  }

  const response = await fetch(
    `${API_URL}${endpoint}`,
    fetchOptions
  );

  let data: unknown = null;

  const contentType =
    response.headers.get("content-type");

  if (
    contentType?.includes(
      "application/json"
    )
  ) {
    data = await response.json();
  }

  if (!response.ok) {
    const errorData =
      data &&
      typeof data === "object"
        ? (data as ApiError)
        : null;

    const message =
      errorData?.detail ||
      `API request failed with status ${response.status}`;

    throw new ApiRequestError(
      message,
      response.status,
      errorData
    );
  }

  return data as T;
}

export function apiGet<T>(
  endpoint: string,
  auth = false
) {
  return apiRequest<T>(
    endpoint,
    {
      method: "GET",
      auth,
    }
  );
}

export function apiPost<T>(
  endpoint: string,
  body?: unknown,
  auth = false
) {
  return apiRequest<T>(
    endpoint,
    {
      method: "POST",
      auth,
      body:
        body !== undefined
          ? JSON.stringify(body)
          : undefined,
      csrf: true,
    }
  );
}

export function apiPatch<T>(
  endpoint: string,
  body?: unknown,
  auth = false
) {
  return apiRequest<T>(
    endpoint,
    {
      method: "PATCH",
      auth,
      body:
        body !== undefined
          ? JSON.stringify(body)
          : undefined,
      csrf: true,
    }
  );
}

export function apiDelete<T>(
  endpoint: string,
  auth = false
) {
  return apiRequest<T>(
    endpoint,
    {
      method: "DELETE",
      auth,
      csrf: true,
    }
  );
}

