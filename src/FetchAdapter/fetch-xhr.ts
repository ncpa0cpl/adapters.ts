import type { RequestMethod, XHRInterface } from "../BaseAdapter";
import type { _ } from "../substitutor";

export type FetchResponse<T> = Response & {
  json(): T;
};

export class FetchXHR<T = _> implements XHRInterface<FetchResponse<T>> {
  private defaultRequestConfig: RequestInit = {};
  private payloadExtractCache = new WeakMap<FetchResponse<any>, any>();

  constructor(config?: RequestInit) {
    if (config) {
      this.defaultRequestConfig = config;
    }
  }

  sendRequest(params: {
    method: RequestMethod;
    url: string;
    data?: Record<string, any> | undefined;
    config?: RequestInit | undefined;
  }): Promise<FetchResponse<T>> {
    if (
      params.method === "GET" &&
      params.data &&
      typeof params.data === "object"
    ) {
      const urlParams = new URLSearchParams();
      for (const key in params.data) {
        const value = params.data[key];
        urlParams.set(key, value.toString());
      }

      params.url += "?" + urlParams.toString();
    }

    return fetch(params.url, {
      ...this.defaultRequestConfig,
      method: params.method,
      body:
        params.data && params.method !== "GET"
          ? JSON.stringify(params.data)
          : undefined,
      ...(params.config ?? {}),
    }) as any;
  }

  async extractPayload(response: FetchResponse<T>): Promise<T> {
    if (this.payloadExtractCache.has(response)) {
      return this.payloadExtractCache.get(response);
    }

    const result = await response.json();

    this.payloadExtractCache.set(response, result);

    return result;
  }
}
