export default class MockResponse<T = unknown> {
  public readonly status: number;

  public readonly body: T;

  constructor(body: T, init: { status: number }) {
    this.body = body;
    this.status = init.status;
  }
}
