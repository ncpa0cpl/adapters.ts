import type { AxiosInstance, AxiosRequestConfig, AxiosResponse } from "axios";
import axios from "axios";
import type { RequestMethod, XHRInterface } from "../BaseAdapter";
import type { _ } from "../substitutor";

export class AxiosXHR<T = _> implements XHRInterface<AxiosResponse<T>> {
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

  async extractPayload(response: AxiosResponse<T>): Promise<unknown> {
    return response.data;
  }
}
