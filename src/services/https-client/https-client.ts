export type RequestMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

export default interface HttpsClient {
  get<T>(url: string, options?: { signal?: AbortSignal }): Promise<T | undefined>;
  post<T, R>(url: string, data: T, options?: { signal?: AbortSignal }): Promise<R | undefined>;
  patch<T, R>(url: string, data: T, options?: { signal?: AbortSignal }): Promise<R | undefined>;
  put<T, R>(url: string, data: T, options?: { signal?: AbortSignal }): Promise<R | undefined>;
  delete<T, R>(url: string, data?: T, options?: { signal?: AbortSignal }): Promise<R | undefined>;
}
