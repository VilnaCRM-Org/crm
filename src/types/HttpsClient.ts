interface HttpResponse {
  status: number;
  data: any;
}

export default interface HttpsClient {
  get(url: string): Promise<HttpResponse>;
  post(url: string, data: any): Promise<HttpResponse>;
  patch(): any;
  put(): any;
  delete(): any;
}
