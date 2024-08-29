import { AdapterEndpoint, AdapterEndpointConfig } from "./adapter-endpoint";
import { AdapterRequestError } from "./request-error";
import { AdapterResponse } from "./response";
import { TypedPromise } from "./typed-promise";
import { extend } from "./utils/extend";
import { Rejects } from "./utils/rejects-decorator";
import { trimCharEnd, trimCharStart } from "./utils/trim-char";
import { RequestMethod, XHRInterface } from "./xhr-interface";
import { FetchXHR } from "./xhr/fetch";

type MaybePromise<T> = T | Promise<T>;

export type DefaultXhrReqConfig = Omit<
  RequestInit,
  "headers" | "body" | "method" | "signal"
>;

export interface AdapterOptions<XhrReqConfig = DefaultXhrReqConfig> {
  defaultTimeout?: number;
  defaultAutoRetry?: undefined | number;
  defaultRetryDelay?: number;
  defaultXhr?: XhrReqConfig;
  defaultHeaders?: HeadersInit;
  baseURL?: string | URL;
  basePath?: string;
  onBeforeRequest?: (
    url: URL,
    config: RequestConfig<XhrReqConfig>,
    body?: unknown,
  ) => MaybePromise<
    void | [url: URL, config: RequestConfig<XhrReqConfig>, body?: unknown]
  >;
  onAfterResponse?: (
    response: AdapterResponse<any>,
  ) => MaybePromise<void | AdapterResponse>;
  onAfterBuildUrl?: (url: URL) => void | URL;
}

export interface RequestConfigBase<XhrReqConfig = DefaultXhrReqConfig> {
  baseURL?: string | URL;
  basePath?: string;
  timeout?: number;
  autoRetry?: undefined | number;
  retryDelay?: number;
  xhr?: XhrReqConfig;
  headers?: HeadersInit;
}

export interface RequestConfig<XhrReqConfig = DefaultXhrReqConfig, T = unknown>
  extends RequestConfigBase<XhrReqConfig>
{
  validate?: (data: unknown) => data is T;
  searchParams?: URLSearchParams | string[][] | Record<string, string>;
}

const noop = () => {};

export class Adapter<XhrReqConfig = DefaultXhrReqConfig, XhrResp = Response> {
  static new<XhrReqConfig = DefaultXhrReqConfig, XhrResp = Response>(
    options?: AdapterOptions<XhrReqConfig>,
    xhr?: XHRInterface<XhrReqConfig, XhrResp>,
  ) {
    return new Adapter(options, xhr);
  }

  private readonly xhr!: XHRInterface<any, any>;
  private readonly baseConfig: RequestConfig<XhrReqConfig> = {};
  private readonly baseHeaders: Headers;
  private readonly beforeRequest;
  private readonly afterResponse;
  private readonly afterBuildUrl;

  private constructor(
    options?: AdapterOptions<XhrReqConfig>,
    xhr?: XHRInterface<XhrReqConfig, any>,
  ) {
    if (xhr) {
      this.xhr = xhr;
    } else {
      this.xhr = new FetchXHR();
    }

    if (options?.defaultTimeout) {
      this.baseConfig.timeout = options.defaultTimeout;
    }
    if (options?.defaultAutoRetry) {
      this.baseConfig.autoRetry = options.defaultAutoRetry;
    }
    if (options?.defaultRetryDelay) {
      this.baseConfig.retryDelay = options.defaultRetryDelay;
    }
    if (options?.defaultXhr) {
      this.baseConfig.xhr = { ...options.defaultXhr };
    }
    if (options?.baseURL) {
      this.baseConfig.baseURL = options.baseURL;
    }
    if (options?.basePath) {
      this.baseConfig.basePath = options.basePath;
    }
    if (options?.defaultHeaders) {
      this.baseHeaders = new Headers(options.defaultHeaders);
    } else {
      this.baseHeaders = new Headers();
    }

    this.beforeRequest = options?.onBeforeRequest;
    this.afterResponse = options?.onAfterResponse;
    this.afterBuildUrl = options?.onAfterBuildUrl;
  }

  private addContentType(h: Headers) {
    if (!h.has("Content-Type")) {
      h.set("Content-Type", "application/json;charset=UTF-8");
    }
  }

  private getBaseUrl(config?: RequestConfigBase<XhrReqConfig>) {
    if (config?.baseURL) {
      return config.baseURL;
    }
    if (typeof window !== "undefined") {
      return window.location.origin;
    }
    return "http://127.0.0.1";
  }

  private prepareUrl(
    url: string | URL,
    config?: RequestConfigBase<XhrReqConfig>,
  ) {
    if (!config?.basePath) {
      return new URL(url, this.getBaseUrl(config));
    }

    const u = new URL(url, this.getBaseUrl(config));
    const newPathname = `${trimCharEnd(config.basePath, "/")}/${trimCharStart(u.pathname, "/")}`;
    u.pathname = newPathname;
    return u;
  }

  private createRequestConfig<T>(
    method: RequestMethod,
    config?: RequestConfig<XhrReqConfig, T>,
  ): RequestConfig<XhrReqConfig, T> {
    if (!config) {
      if (method === "GET" || method === "OPTIONS") {
        return extend(this.baseConfig, { headers: this.baseHeaders }) as RequestConfig<XhrReqConfig, T>;
      }

      const headers = new Headers(this.baseHeaders);
      this.addContentType(headers);

      return extend(this.baseConfig, {
        headers,
      }) as RequestConfig<XhrReqConfig, T>;
    }

    const finalConfig = extend(
      this.baseConfig as RequestConfig<XhrReqConfig, T>,
      config,
    );

    finalConfig.headers = new Headers(this.baseHeaders);
    if (config.headers) {
      new Headers(config.headers).forEach((value, key) => {
        (finalConfig.headers as Headers).set(key, value);
      });
    }

    if (method !== "GET" && method !== "OPTIONS") {
      this.addContentType(finalConfig.headers);
    }

    if (config.xhr) {
      if (this.baseConfig.xhr) {
        finalConfig.xhr = extend(this.baseConfig.xhr, config.xhr);
      }
    }

    return finalConfig;
  }

  private createTimeout(config?: RequestConfig<XhrReqConfig, any>) {
    if (!config || !config.timeout) {
      return [undefined, noop] as const;
    }

    const abortController = new AbortController();

    const tid = setTimeout(() => {
      abortController.abort(
        new AdapterRequestError(config, "Request aborted, timeout exceeded"),
      );
    }, config.timeout);

    return [
      abortController.signal,
      () => {
        clearTimeout(tid);
      },
    ] as const;
  }

  private async requestInternal<T>(
    method: RequestMethod,
    url: URL,
    config: RequestConfig<XhrReqConfig, T>,
    body?: any,
    attemptsLeft = 0,
  ): Promise<AdapterResponse<XhrResp, T>> {
    let responseStatus = -1;

    try {
      const [abortSignal, clearTimeout] = this.createTimeout(config);

      const [response, status, statusText] = await this.xhr.sendRequest({
        method,
        url: url.toString(),
        config: config.xhr,
        headers: config.headers as Headers,
        body: body,
        abortSignal: abortSignal,
      });

      clearTimeout();
      responseStatus = status;

      if (status >= 400 && status < 500) {
        throw new AdapterRequestError(
          config,
          `Request failure: [${status}] ${statusText}`,
          response,
          status,
        );
      } else if (status >= 500) {
        throw new AdapterRequestError(
          config,
          `Server error: [${status}] ${statusText}`,
          response,
          status,
        );
      }

      let data = (await this.xhr.extractPayload(response)) as T;
      if (config.validate) {
        if (!config.validate(data)) {
          throw new AdapterRequestError(config, "Invalid response data");
        }
      }

      const resp = new AdapterResponse(this, config, data, response);

      if (this.afterResponse) {
        const override = await this.afterResponse(resp);
        if (override) {
          return override as AdapterResponse<XhrResp, T>;
        }
      }

      return resp;
    } catch (error) {
      // only retry if the request was not sent or the response indicates a failure
      // do not retry if the error is dur to timeout, validation error, payload
      // extraction error or other local problem
      if (attemptsLeft > 0 && !(responseStatus >= 200 && responseStatus < 300)) {
        if (config.retryDelay) {
          await new Promise((resolve) => setTimeout(resolve, config.retryDelay));
        }
        return this.requestInternal(
          method,
          url,
          config,
          body,
          attemptsLeft - 1,
        );
      } else {
        throw error;
      }
    }
  }

  async request<T>(
    method: RequestMethod,
    url: string | URL,
    config?: RequestConfig<XhrReqConfig, T>,
    body?: any,
    // @ts-expect-error
  ): TypedPromise<AdapterResponse<XhrResp, T>, AdapterRequestError> {
    try {
      config = this.createRequestConfig(method, config);

      let u = this.prepareUrl(url, config);
      if (config.searchParams) {
        const sp = new URLSearchParams(config.searchParams);
        u.search = sp.toString();
      }

      if (this.afterBuildUrl) {
        const override = this.afterBuildUrl(u);
        if (override) {
          u = override;
        }
      }

      if (this.beforeRequest) {
        const override = await this.beforeRequest(u, config, body);
        if (override) {
          u = override[0];
          config = override[1] as RequestConfig<XhrReqConfig, T>;
          body = override[2];
        }
      }

      return await this.requestInternal(
        method,
        u,
        config,
        body,
        config.autoRetry ? config.autoRetry - 1 : undefined,
      );
    } catch (error) {
      if (AdapterRequestError.is(error)) {
        throw error;
      }
      throw new AdapterRequestError(
        config,
        "Unexpected error",
        undefined,
        error,
      );
    }
  }

  @Rejects
  get<T = unknown>(url: string, config?: RequestConfig<XhrReqConfig, T>) {
    return this.request("GET", url, config);
  }

  @Rejects
  post<T = unknown>(
    url: string,
    config?: RequestConfig<XhrReqConfig, T> & { body?: any },
  ) {
    return this.request("POST", url, config, config?.body);
  }

  @Rejects
  patch<T = unknown>(
    url: string,
    config?: RequestConfig<XhrReqConfig, T> & { body?: any },
  ) {
    return this.request("PATCH", url, config, config?.body);
  }

  @Rejects
  put<T = unknown>(
    url: string,
    config?: RequestConfig<XhrReqConfig, T> & { body?: any },
  ) {
    return this.request("PUT", url, config, config?.body);
  }

  @Rejects
  delete<T = unknown>(
    url: string,
    config?: RequestConfig<XhrReqConfig, T> & { body?: any },
  ) {
    return this.request("DELETE", url, config, config?.body);
  }

  @Rejects
  options<T = unknown>(url: string, config?: RequestConfig<XhrReqConfig, T>) {
    return this.request("OPTIONS", url, config);
  }

  endpoint<
    const Url extends string,
    const SearchParams extends string[] = [],
    GetT = unknown,
    PostT = unknown,
    PatchT = unknown,
    PutT = unknown,
    DeleteT = unknown,
    OptionsT = unknown,
    PostReqT = unknown,
    PatchReqT = unknown,
    PutReqT = unknown,
    DeleteReqT = unknown,
  >(
    params: AdapterEndpointConfig<
      Url,
      SearchParams,
      GetT,
      PostT,
      PatchT,
      PutT,
      DeleteT,
      OptionsT,
      PostReqT,
      PatchReqT,
      PutReqT,
      DeleteReqT
    >,
  ) {
    return new AdapterEndpoint(this, params);
  }
}

export const adapter = Adapter.new();
