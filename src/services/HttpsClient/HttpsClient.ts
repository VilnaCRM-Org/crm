export interface HttpResponse extends Response{
  status: number;
  data: any;
}

export interface GetOptions {
  token: string
}

export default interface HttpsClient {
  get(url: string, options: GetOptions): Promise<Response>;
  post(url: string, data: any): Promise<HttpResponse>;
  patch(): any;
  put(): any;
  delete(): any;
}
