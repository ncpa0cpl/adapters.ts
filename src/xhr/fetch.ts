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
      let contentType = params.headers?.get("Content-Type");
      if (contentType != null) {
        contentType = contentType.split(";")[0];
      }

      switch (contentType) {
        case "application/json":
          init.body = JSON.stringify(params.body);
          break;
        case "text/plain":
          init.body = String(params.body);
          break;
        case "application/x-www-form-urlencoded":
          init.body = new URLSearchParams(params.body as Record<string, string>);
          break;
        case "multipart/form-data":
          const formData = new FormData();
          for (const key in params.body) {
            formData.append(key, params.body[key]);
          }
          init.body = formData;
          break;
        default:
          init.body = params.body as BodyInit;
          break;
      }
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
