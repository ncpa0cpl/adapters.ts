import type { AxiosInstance, AxiosRequestConfig, AxiosResponse } from "axios";
import axios from "axios";
import type { RequestMethod, XHRInterface } from "../BaseAdapter";

export class AxiosXHR<T> implements XHRInterface {
  private axiosInstance: AxiosInstance;

  constructor(axiosInstance?: AxiosInstance) {
    if (axiosInstance) {
      this.axiosInstance = axiosInstance;
    } else {
      this.axiosInstance = axios.create();
    }
  }

  sendRequest(params: {
    type: RequestMethod;
    url: string;
    data?: Record<string, any> | undefined;
    config?: AxiosRequestConfig<any> | undefined;
  }): Promise<AxiosResponse<T>> {
    return this.axiosInstance.request({
      method: params.type,
      url: params.url,
      data: params.type === "GET" ? undefined : params.data,
      params: params.type === "GET" ? params.data : undefined,
      ...(params.config ?? {}),
    });
  }

  async extractPayload(response: AxiosResponse<any, any>): Promise<unknown> {
    return response.data;
  }
}

// interface Int {
//   sendRequest(): Promise<any>;
// }

// interface AxiosInt<T> {
//   sendRequest(): Promise<AxiosResponse<T>>;
// }

// class Test {
//   static readonly inter: Int;

//   static get<T extends typeof Test>(
//     this: T
//   ): ReturnType<$<T["inter"], [string]>["sendRequest"]> {
//     throw {};
//   }
// }

// class Test2 extends Test {
//   static readonly inter: AxiosInt<_>;
// }

// const a = await Test2.get();
