import type { RequestMethod, XHRInterface } from "../BaseAdapter";

export type FetchResponse<T> = Response & {
  json(): T;
};

export class FetchXHR<T> implements XHRInterface {
  private defaultRequestConfig: RequestInit = {};

  constructor(config?: RequestInit) {
    if (config) {
      this.defaultRequestConfig = config;
    }
  }

  sendRequest(params: {
    type: RequestMethod;
    url: string;
    data?: Record<string, any> | undefined;
    config?: RequestInit | undefined;
  }): Promise<FetchResponse<T>> {
    if (
      params.type === "GET" &&
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
      method: params.type,
      body:
        params.data && params.type !== "GET"
          ? JSON.stringify(params.data)
          : undefined,
      ...(params.config ?? {}),
    }) as any;
  }

  async extractPayload(response: FetchResponse<any>): Promise<unknown> {
    return await response.json();
  }
}
