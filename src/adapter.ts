import { AdapterEndpoint, AdapterEndpointConfig, Endpoint, HttpMethod, Validator } from "./adapter-endpoint";
import { AdapterRequestError } from "./request-error";
import { AdapterResponse } from "./response";
import { StandardSchemaV1 } from "./standar-schema/interface";
import { validate } from "./standar-schema/validate";
import { TypedPromise } from "./typed-promise";
import { arrRemove } from "./utils/arr-remove";
import { extend } from "./utils/extend";
import { Rejects } from "./utils/rejects-decorator";
import { trimCharEnd, trimCharStart } from "./utils/trim-char";
import { RequestMethod, XHRInterface } from "./xhr-interface";
import { FetchXHR } from "./xhr/fetch";

type MaybePromise<T> = T | Promise<T>;

export type DefaultXhrReqConfig =
  & Omit<
    RequestInit,
    "headers" | "body" | "method" | "signal"
  >
  & {
    /**
     * Overrides the default behavior of detecting the content type via
     * headers, and use the specified content type instead.
     */
    responseType?: "json" | "text" | "blob" | "arrayBuffer" | "formData" | "none";
  };

export interface BeforeRequestHandler<XhrReqConfig> {
  (
    url: URL,
    config: RequestConfig<XhrReqConfig>,
    body: unknown,
    method: RequestMethod,
  ): MaybePromise<
    void | [url: URL, config: RequestConfig<XhrReqConfig>, body: unknown] | AdapterResponse
  >;
}

export interface AfterResponseHandler {
  <Xhr, T>(
    response: AdapterResponse<Xhr, T>,
  ): MaybePromise<void | AdapterResponse<Xhr, T>>;
}

export interface AfterBuildUrlHandler {
  (url: URL): void | URL;
}

export interface RequestErrorHandler<XhrResp> {
  (error: AdapterRequestError<XhrResp>): void | AdapterRequestError<XhrResp>;
}

export interface AdapterOptions<XhrReqConfig = DefaultXhrReqConfig, XhrResp = Response> {
  defaultTimeout?: number;
  defaultAutoRetry?: undefined | number;
  defaultRetryDelay?: number;
  defaultXhr?: XhrReqConfig;
  defaultHeaders?: HeadersInit;
  baseURL?: string | URL;
  basePath?: string;
  onBeforeRequest?: BeforeRequestHandler<XhrReqConfig>[];
  onAfterResponse?: AfterResponseHandler[];
  onAfterBuildUrl?: AfterBuildUrlHandler[];
  onRequestError?: RequestErrorHandler<XhrResp>[];
}

export interface RequestConfigBase<XhrReqConfig = DefaultXhrReqConfig> {
  baseURL?: string | URL;
  basePath?: string;
  timeout?: number;
  autoRetry?: undefined | number;
  retryDelay?: number;
  xhr?: XhrReqConfig;
  headers?: HeadersInit;
  abortSignal?: AbortSignal;
}

export interface RequestConfig<XhrReqConfig = DefaultXhrReqConfig, T = unknown>
  extends RequestConfigBase<XhrReqConfig>
{
  validate?: Validator<T>;
  searchParams?: URLSearchParams | string[][] | Record<string, string>;
}

const noop = () => {};

export class Adapter<XhrReqConfig = DefaultXhrReqConfig, XhrResp = Response> {
  private static mergeConfigs<T, U>(
    base: readonly [conf: RequestConfig<T, U>, headers: Headers],
    target: readonly [conf: RequestConfig<T, U>, headers?: HeadersInit],
  ) {
    const [baseConf, baseHeaders] = base;
    const [targetConf, targetHeaders] = target;

    const outHeaders = new Headers(baseHeaders);
    if (targetHeaders) {
      new Headers(targetHeaders).forEach((value, key) => {
        outHeaders.set(key, value);
      });
    }

    const outConf = extend(baseConf, targetConf);

    if (baseConf.basePath && targetConf.basePath) {
      outConf.basePath = trimCharEnd(baseConf.basePath, "/") + "/" + trimCharStart(targetConf.basePath, "/");
    }

    if (targetConf.xhr && baseConf.xhr) {
      outConf.xhr = extend(baseConf.xhr, targetConf.xhr);
    }

    return [outConf, outHeaders] as const;
  }

  private static initOptionsToBaseConfig<XhrReqConfig, XhrResp>(
    options?: AdapterOptions<XhrReqConfig, XhrResp>,
  ) {
    const baseConfig: RequestConfigBase<XhrReqConfig> = {};
    let baseHeaders: Headers;

    if (options?.defaultTimeout != null) {
      baseConfig.timeout = options.defaultTimeout;
    }
    if (options?.defaultAutoRetry != null) {
      baseConfig.autoRetry = options.defaultAutoRetry;
    }
    if (options?.defaultRetryDelay != null) {
      baseConfig.retryDelay = options.defaultRetryDelay;
    }
    if (options?.defaultXhr != null) {
      baseConfig.xhr = { ...options.defaultXhr };
    }
    if (options?.baseURL != null) {
      baseConfig.baseURL = options.baseURL;
    }
    if (options?.basePath != null) {
      baseConfig.basePath = options.basePath;
    }
    if (options?.defaultHeaders != null) {
      baseHeaders = new Headers(options.defaultHeaders);
    } else {
      baseHeaders = new Headers();
    }

    return [baseConfig, baseHeaders] as const;
  }

  static new<XhrReqConfig = DefaultXhrReqConfig, XhrResp = Response>(
    options?: AdapterOptions<XhrReqConfig>,
    xhr?: XHRInterface<XhrReqConfig, XhrResp>,
  ) {
    return new Adapter(options, xhr);
  }

  protected extendsFrom?: Adapter<XhrReqConfig, XhrResp>;
  private readonly xhr!: XHRInterface<any, any>;
  private baseConfig: RequestConfig<XhrReqConfig>;
  private baseHeaders!: Headers;
  private beforeRequestHandlers;
  private afterResponseHandlers;
  private afterBuildUrlHandlers;
  private afterRequestErrorHandlers;

  private constructor(
    options?: AdapterOptions<XhrReqConfig, XhrResp>,
    xhr?: XHRInterface<XhrReqConfig, any>,
  ) {
    if (xhr) {
      this.xhr = xhr;
    } else {
      this.xhr = new FetchXHR();
    }

    const [baseConfig, baseHeaders] = Adapter.initOptionsToBaseConfig(options);

    this.baseConfig = baseConfig;
    this.baseHeaders = baseHeaders;

    this.beforeRequestHandlers = options?.onBeforeRequest ?? [];
    this.afterResponseHandlers = options?.onAfterResponse ?? [];
    this.afterBuildUrlHandlers = options?.onAfterBuildUrl ?? [];
    this.afterRequestErrorHandlers = options?.onRequestError ?? [];
  }

  private async runBeforeRequestHandlers<T>(
    url: URL,
    config: RequestConfig<XhrReqConfig>,
    body: unknown,
    method: RequestMethod,
  ): Promise<[url: URL, config: RequestConfig<XhrReqConfig>, body?: unknown] | AdapterResponse<XhrResp, T>> {
    if (this.extendsFrom) {
      const ov = await this.extendsFrom.runBeforeRequestHandlers(url, config, body, method);
      if (AdapterResponse.is(ov)) {
        return ov as any;
      }
      [url, config, body] = ov as [URL, RequestConfig<XhrReqConfig>, unknown];
    }

    for (const handler of this.beforeRequestHandlers) {
      let override = await handler(url, config, body, method);
      if (override) {
        if (AdapterResponse.is(override)) {
          return override as any;
        }
        override = override as [URL, RequestConfig<XhrReqConfig>, unknown];
        url = override[0];
        config = override[1];
        body = override[2];
      }
    }
    return [url, config, body] as const;
  }

  private async runAfterResponseHandlers<T>(response: AdapterResponse<XhrResp, T>) {
    if (this.extendsFrom) {
      response = await this.extendsFrom.runAfterResponseHandlers(response);
    }

    for (const handler of this.afterResponseHandlers) {
      const override = await handler(response);
      if (override) {
        response = override;
      }
    }
    return response;
  }

  private runAfterBuildUrlHandlers(url: URL) {
    if (this.extendsFrom) {
      url = this.extendsFrom.runAfterBuildUrlHandlers(url);
    }

    for (const handler of this.afterBuildUrlHandlers) {
      const override = handler(url);
      if (override) {
        url = override;
      }
    }
    return url;
  }

  private runAfterRequestErrorHandlers(error: AdapterRequestError<XhrResp>) {
    if (this.extendsFrom) {
      error = this.extendsFrom.runAfterRequestErrorHandlers(error);
    }

    for (const handler of this.afterRequestErrorHandlers) {
      const override = handler(error);
      if (override) {
        error = override;
      }
    }
    return error;
  }

  private handleRequestError(err: unknown, config: RequestConfig<XhrReqConfig>, method: RequestMethod, url?: string) {
    let error: AdapterRequestError<XhrResp>;
    if (AdapterRequestError.is(err)) {
      error = err as AdapterRequestError<XhrResp>;
    } else {
      error = new AdapterRequestError<XhrResp>(
        "Unexpected error",
        config,
        method,
        url,
        undefined,
        undefined,
        err,
      );
    }

    return this.runAfterRequestErrorHandlers(error);
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
      if (method !== "GET" && method !== "OPTIONS") {
        const headers = new Headers(this.baseHeaders);
        this.addContentType(headers);

        return extend(this.baseConfig, {
          headers,
        }) as RequestConfig<XhrReqConfig, T>;
      }

      return extend(this.baseConfig, { headers: this.baseHeaders }) as RequestConfig<XhrReqConfig, T>;
    }

    const [finalConfig, finalHeaders] = Adapter.mergeConfigs<XhrReqConfig, T>(
      [this.baseConfig as any, this.baseHeaders],
      [config, config.headers],
    );

    finalConfig.headers = finalHeaders;

    if (method !== "GET" && method !== "OPTIONS") {
      this.addContentType(finalHeaders);
    }

    return finalConfig;
  }

  private createTimeout(config: RequestConfig<XhrReqConfig, any>, method: RequestMethod, url: string) {
    if (!config || !config.timeout) {
      return [undefined, noop] as const;
    }

    const abortController = new AbortController();

    const tid = setTimeout(() => {
      abortController.abort(
        new AdapterRequestError("Request aborted, timeout exceeded", config, method, url),
      );
    }, config.timeout);

    if (config.abortSignal) {
      config.abortSignal.addEventListener("abort", () => {
        clearTimeout(tid);
        abortController.abort(config.abortSignal?.reason);
      }, { once: true });
    }

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
    const urlStr = url.toString();

    try {
      const [abortSignal, clearTimeout] = this.createTimeout(config, method, urlStr);

      const [response, status, statusText] = await this.xhr.sendRequest({
        method,
        url: urlStr,
        config: config.xhr,
        headers: config.headers as Headers,
        body: body,
        abortSignal: abortSignal,
      });

      clearTimeout();
      responseStatus = status;

      if (status >= 400 && status < 500) {
        throw new AdapterRequestError<XhrResp>(
          `Request failure: [${status}] ${statusText}`,
          config,
          method,
          urlStr,
          status,
          response,
        );
      } else if (status >= 500) {
        throw new AdapterRequestError<XhrResp>(
          `Server error: [${status}] ${statusText}`,
          config,
          method,
          urlStr,
          status,
          response,
        );
      }

      let data = (await this.xhr.extractPayload(response, config.xhr)) as T;
      if (config.validate) {
        let issues: readonly StandardSchemaV1.Issue[] | undefined;
        if (!validate(config.validate, data, iss => (issues = iss))) {
          throw new AdapterRequestError<XhrResp>(
            "Invalid response data",
            config,
            method,
            urlStr,
            status,
            response,
          ).withIssues(issues);
        }
      }

      const resp = new AdapterResponse(this, method, url, config, data, response);

      return await this.runAfterResponseHandlers(resp);
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
    let urlStr = String(url);
    try {
      config = this.createRequestConfig(method, config);

      let u = this.prepareUrl(url, config);
      if (config.searchParams) {
        const sp = new URLSearchParams(config.searchParams);
        u.search = sp.toString();
      }
      urlStr = u.toString();

      u = this.runAfterBuildUrlHandlers(u);
      urlStr = u.toString();

      let override = await this.runBeforeRequestHandlers(u, config, body, method);
      if (override) {
        if (AdapterResponse.is(override)) {
          return override as AdapterResponse<XhrResp, T>;
        }
        override = override as [URL, RequestConfig<XhrReqConfig, T>, any];
        u = override[0];
        config = override[1] as RequestConfig<XhrReqConfig, T>;
        body = override[2];
        urlStr = u.toString();
      }

      return await this.requestInternal(
        method,
        u,
        config,
        body,
        config.autoRetry ? config.autoRetry - 1 : undefined,
      );
    } catch (err) {
      throw this.handleRequestError(err, config!, method, urlStr);
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

  extend(options?: AdapterOptions<XhrReqConfig, XhrResp>) {
    const adapter = new Adapter<XhrReqConfig, XhrResp>(undefined, this.xhr);
    adapter.extendsFrom = this;

    const [baseConfig, baseHeader] = Adapter.mergeConfigs(
      [this.baseConfig, this.baseHeaders],
      Adapter.initOptionsToBaseConfig(options),
    );

    adapter.baseConfig = baseConfig;
    adapter.baseHeaders = baseHeader;

    if (options?.onBeforeRequest) {
      adapter.beforeRequestHandlers.push(...options.onBeforeRequest);
    }

    if (options?.onAfterResponse) {
      adapter.afterResponseHandlers.push(...options.onAfterResponse);
    }

    if (options?.onAfterBuildUrl) {
      adapter.afterBuildUrlHandlers.push(...options.onAfterBuildUrl);
    }

    if (options?.onRequestError) {
      adapter.afterRequestErrorHandlers.push(...options.onRequestError);
    }

    return adapter;
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
    const AcceptedMethods extends HttpMethod[] = HttpMethod[],
  >(
    params:
      & AdapterEndpointConfig<
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
        DeleteReqT,
        AcceptedMethods
      >
      & {
        options?: AdapterOptions<XhrReqConfig, XhrResp>;
      },
  ): Endpoint<
    AdapterEndpoint<
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
      DeleteReqT,
      XhrReqConfig,
      XhrResp,
      AcceptedMethods
    >,
    AcceptedMethods
  > {
    if (params.options) {
      const { options, ...rest } = params;
      const adapter = this.extend(options);
      return new AdapterEndpoint(adapter, rest) as any;
    }

    return new AdapterEndpoint(this, params) as any;
  }

  addHandler(type: "beforeRequest", handler: BeforeRequestHandler<XhrReqConfig>): void;
  addHandler(type: "afterResponse", handler: AfterResponseHandler): void;
  addHandler(type: "afterBuildUrl", handler: AfterBuildUrlHandler): void;
  addHandler(type: "requestError", handler: RequestErrorHandler<XhrResp>): void;
  addHandler(type: string, handler: any) {
    switch (type) {
      case "beforeRequest":
        this.beforeRequestHandlers.push(handler);
        break;
      case "afterResponse":
        this.afterResponseHandlers.push(handler);
        break;
      case "afterBuildUrl":
        this.afterBuildUrlHandlers.push(handler);
        break;
      case "requestError":
        this.afterRequestErrorHandlers.push(handler);
        break;
    }
  }

  removeHandler(type: "beforeRequest", handler: BeforeRequestHandler<XhrReqConfig>): void;
  removeHandler(type: "afterResponse", handler: AfterResponseHandler): void;
  removeHandler(type: "afterBuildUrl", handler: AfterBuildUrlHandler): void;
  removeHandler(type: "requestError", handler: RequestErrorHandler<XhrResp>): void;
  removeHandler(type: string, handler: any) {
    switch (type) {
      case "beforeRequest":
        arrRemove(this.beforeRequestHandlers, handler);
        break;
      case "afterResponse":
        arrRemove(this.afterResponseHandlers, handler);
        break;
      case "afterBuildUrl":
        arrRemove(this.afterBuildUrlHandlers, handler);
        break;
      case "requestError":
        arrRemove(this.afterRequestErrorHandlers, handler);
        break;
    }
  }
}

export const adapter = Adapter.new();
