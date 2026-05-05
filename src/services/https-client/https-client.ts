export type RequestMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

export default interface HttpsClient {
  get<T>(url: string, options?: { signal?: AbortSignal }): Promise<T>;
  post<T, R>(url: string, data: T, options?: { signal?: AbortSignal }): Promise<R>;
  patch<T, R>(url: string, data: T, options?: { signal?: AbortSignal }): Promise<R>;
  put<T, R>(url: string, data: T, options?: { signal?: AbortSignal }): Promise<R>;
  delete<T, R>(url: string, data?: T, options?: { signal?: AbortSignal }): Promise<R>;
}
