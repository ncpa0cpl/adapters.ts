import { DefaultXhrReqConfig } from "../adapter";
import { RequestMethod, XHRInterface } from "../xhr-interface";

export type FetchResponse<T> = Response & {
  json(): T;
};

export class FetchXHR implements XHRInterface<DefaultXhrReqConfig, FetchResponse<any>> {
  constructor() {}

  async sendRequest<T>(params: {
    method: RequestMethod;
    url: string;
    body?: Record<string, any> | undefined;
    config?: DefaultXhrReqConfig | undefined;
    headers?: Headers | undefined;
    abortSignal?: AbortSignal | undefined;
  }): Promise<[FetchResponse<T>, number, string]> {
    const init: RequestInit = { ...params.config, method: params.method };
    if (params.body) {
      init.body = JSON.stringify(params.body);
    }
    if (params.headers) {
      init.headers = params.headers;
    }
    if (params.abortSignal) {
      init.signal = params.abortSignal;
    }

    const resp = await fetch(params.url, init);

    return [resp as any, resp.status, resp.statusText];
  }

  async extractPayload<T>(response: FetchResponse<T>): Promise<T> {
    return await response.json();
  }
}
