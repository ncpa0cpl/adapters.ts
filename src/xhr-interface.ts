export type RequestMethod =
  | "DELETE"
  | "GET"
  | "OPTIONS"
  | "PATCH"
  | "POST"
  | "PUT";

export type XHRInterface<Conf, R> = {
  sendRequest(params: {
    method: RequestMethod;
    url: string;
    body?: Record<string, any>;
    config?: Conf;
    headers?: Headers;
    abortSignal?: AbortSignal;
  }): Promise<[response: R, status: number, statusText: string]>;

  extractPayload(response: R, config?: Conf): Promise<unknown>;
};
