export type RequestMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

export default interface HttpsClient {
  get<T>(url: string): Promise<T>;
  post<T>(url: string, data: T): Promise<T>;
  patch<T>(url: string, data: T): Promise<T>;
  put<T>(url: string, data: T): Promise<T>;
  delete<T>(url: string, data: T): Promise<T>;
};
