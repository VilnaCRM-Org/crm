export type RequestMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

export default interface HttpsClient {
  get<T>(url: string): Promise<T>;
  post<T, R>(url: string, data: T): Promise<R>;
  patch<T, R>(url: string, data: T): Promise<R>;
  put<T, R>(url: string, data: T): Promise<R>;
  delete<T, R>(url: string, data?: T): Promise<R>;
}
