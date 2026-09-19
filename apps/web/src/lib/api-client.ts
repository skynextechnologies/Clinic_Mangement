export interface ApiProblemDetails {
  type?: string;
  title: string;
  status: number;
  code: string;
  detail?: string;
  instance?: string;
  requestId?: string;
  errors?: Array<{ path: string; message: string }>;
}

export class ApiError extends Error {
  public readonly problem: ApiProblemDetails;

  constructor(problem: ApiProblemDetails) {
    super(problem.detail || problem.title);
    this.name = 'ApiError';
    this.problem = problem;
  }
}

export interface ResponseEnvelope<T> {
  data: T;
  meta?: {
    page?: number;
    pageSize?: number;
    total?: number;
    requestId?: string;
    [key: string]: unknown;
  };
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export async function fetchApi<T>(
  path: string,
  options: RequestInit = {},
): Promise<ResponseEnvelope<T>> {
  const url = path.startsWith('http')
    ? path
    : `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;

  const requestId =
    typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `req-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

  const headers = new Headers(options.headers);
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }
  if (!headers.has('x-request-id')) {
    headers.set('x-request-id', requestId);
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  const contentType = response.headers.get('content-type') || '';

  if (!response.ok) {
    if (
      contentType.includes('application/problem+json') ||
      contentType.includes('application/json')
    ) {
      const problemData = (await response.json()) as ApiProblemDetails;
      throw new ApiError({
        title: problemData.title || 'API Error',
        status: response.status,
        code: problemData.code || 'UNKNOWN_ERROR',
        detail: problemData.detail,
        instance: problemData.instance || path,
        requestId: problemData.requestId || requestId,
        errors: problemData.errors,
      });
    }

    throw new ApiError({
      title: 'HTTP Error',
      status: response.status,
      code: `HTTP_${response.status}`,
      detail: response.statusText,
      instance: path,
      requestId,
    });
  }

  if (response.status === 24) {
    return { data: null as unknown as T };
  }

  const responseBody = await response.json();

  if (responseBody && typeof responseBody === 'object' && 'data' in responseBody) {
    return responseBody as ResponseEnvelope<T>;
  }

  return {
    data: responseBody as T,
    meta: { requestId },
  };
}
