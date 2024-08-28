import { UrlLiteralParams, urlTemplate } from "url-templater.ts";
import { type Adapter, type DefaultXhrReqConfig, RequestConfigBase } from "./adapter";
import { AdapterRequestError as AdapterRequestError } from "./request-error";
import { extend } from "./utils/extend";
import { Rejects } from "./utils/rejects-decorator";

export type ValidateFn<T> = (data: unknown) => data is T;

export interface AdapterEndpointConfig<
  Url extends string,
  SearchParams extends string[],
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
> {
  url: Url;
  searchParams?: SearchParams;
  validate?: {
    get?: ValidateFn<GetT>;
    post?: ValidateFn<PostT>;
    patch?: ValidateFn<PatchT>;
    put?: ValidateFn<PutT>;
    delete?: ValidateFn<DeleteT>;
    options?: ValidateFn<OptionsT>;
  };
  validateRequest?: {
    post?: ValidateFn<PostReqT>;
    patch?: ValidateFn<PatchReqT>;
    put?: ValidateFn<PutReqT>;
    delete?: ValidateFn<DeleteReqT>;
  };
}

type SearchParamsRecord<SearchParams extends readonly string[]> =
  & {
    [
      K in SearchParams[number] as K extends `?${infer PName}` ? PName
        : never
    ]?: string;
  }
  & {
    [
      K in SearchParams[number] as K extends `?${infer PName}` ? never
        : K
    ]: string;
  };

type ConfigFor<
  SearchParams extends readonly string[] = [],
  Body = never,
  XhrReqConfig = DefaultXhrReqConfig,
> = SearchParams["length"] extends 0 ? [Body] extends [never] ? [config?: RequestConfigBase<XhrReqConfig>]
  : [config: RequestConfigBase<XhrReqConfig> & { body: Body }]
  : [Body] extends [never] ? [
      config: RequestConfigBase<XhrReqConfig> & {
        searchParams: SearchParamsRecord<SearchParams>;
      },
    ]
  : [
    config: RequestConfigBase<XhrReqConfig> & {
      searchParams: SearchParamsRecord<SearchParams>;
      body: Body;
    },
  ];

type RequestArguments<
  Url extends string,
  SearchParams extends string[] = [],
  XhrReqConfig = DefaultXhrReqConfig,
  Body = never,
> = UrlLiteralParams<Url> extends Record<string, never> ? ConfigFor<SearchParams, Body, XhrReqConfig>
  : [
    queryParams: UrlLiteralParams<Url>,
    ...ConfigFor<SearchParams, Body, XhrReqConfig>,
  ];

type ResolvedParams<Url extends string> = {
  urlParams?: UrlLiteralParams<Url>;
  config?: RequestConfigBase<any> & {
    body?: any;
  };
};

export class AdapterEndpoint<
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
  XhrReqConfig = DefaultXhrReqConfig,
> {
  private urlTemplate;

  constructor(
    private readonly adapter: Adapter<XhrReqConfig>,
    private readonly params: AdapterEndpointConfig<
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
    this.urlTemplate = urlTemplate(params.url);
  }

  private validateSearchParams(
    config:
      | (RequestConfigBase<XhrReqConfig> & {
        searchParams?: Record<string, string>;
      })
      | undefined,
  ) {
    if (!this.params.searchParams || this.params.searchParams.length === 0) {
      return;
    }

    for (let i = 0; i < this.params.searchParams.length; i++) {
      const paramName = this.params.searchParams[i]!;
      if (paramName[0] === "?") {
        continue;
      }

      if (
        !config
        || !config?.searchParams
        || config.searchParams[paramName] == null
      ) {
        throw new AdapterRequestError(
          config,
          `Missing a required search param: ${paramName}`,
        );
      }
    }
  }

  private resolveArgs(args: any[]): ResolvedParams<Url> {
    if (args.length === 2) {
      return {
        urlParams: args[0],
        config: args[1],
      };
    }

    if (this.urlTemplate.parametersCount === 0) {
      return {
        urlParams: undefined,
        config: args[0],
      };
    }

    return {
      urlParams: args[0],
      config: undefined,
    };
  }

  @Rejects
  get(...args: RequestArguments<Url, SearchParams, XhrReqConfig>) {
    const { config, urlParams } = this.resolveArgs(args);
    this.validateSearchParams(config);

    let url = "";
    if (urlParams) {
      url = this.urlTemplate.generate(urlParams);
    } else {
      url = this.params.url;
    }

    return this.adapter.request(
      "GET",
      url,
      config
        ? extend(config, { validate: this.params.validate?.get })
        : { validate: this.params.validate?.get },
    );
  }

  @Rejects
  post(...args: RequestArguments<Url, SearchParams, XhrReqConfig, PostReqT>) {
    const { config, urlParams } = this.resolveArgs(args);
    this.validateSearchParams(config);

    let url = "";
    if (urlParams) {
      url = this.urlTemplate.generate(urlParams);
    } else {
      url = this.params.url;
    }

    if (this.params.validateRequest?.post) {
      if (!this.params.validateRequest.post(config?.body)) {
        throw new AdapterRequestError(config, "Invalid request body");
      }
    }

    return this.adapter.request(
      "POST",
      url,
      config
        ? extend(config, { validate: this.params.validate?.post })
        : { validate: this.params.validate?.post },
      config?.body,
    );
  }

  @Rejects
  patch(...args: RequestArguments<Url, SearchParams, XhrReqConfig, PatchReqT>) {
    const { config, urlParams } = this.resolveArgs(args);
    this.validateSearchParams(config);

    let url = "";
    if (urlParams) {
      url = this.urlTemplate.generate(urlParams);
    } else {
      url = this.params.url;
    }

    if (this.params.validateRequest?.patch) {
      if (!this.params.validateRequest.patch(config?.body)) {
        throw new AdapterRequestError(config, "Invalid request body");
      }
    }

    return this.adapter.request(
      "PATCH",
      url,
      config
        ? extend(config, { validate: this.params.validate?.patch })
        : { validate: this.params.validate?.patch },
      config?.body,
    );
  }

  @Rejects
  put(...args: RequestArguments<Url, SearchParams, XhrReqConfig, PutReqT>) {
    const { config, urlParams } = this.resolveArgs(args);
    this.validateSearchParams(config);

    let url = "";
    if (urlParams) {
      url = this.urlTemplate.generate(urlParams);
    } else {
      url = this.params.url;
    }

    if (this.params.validateRequest?.put) {
      if (!this.params.validateRequest.put(config?.body)) {
        throw new AdapterRequestError(config, "Invalid request body");
      }
    }

    return this.adapter.request(
      "PUT",
      url,
      config
        ? extend(config, { validate: this.params.validate?.put })
        : { validate: this.params.validate?.put },
      config?.body,
    );
  }

  @Rejects
  delete(
    ...args: RequestArguments<Url, SearchParams, XhrReqConfig, DeleteReqT>
  ) {
    const { config, urlParams } = this.resolveArgs(args);
    this.validateSearchParams(config);

    let url = "";
    if (urlParams) {
      url = this.urlTemplate.generate(urlParams);
    } else {
      url = this.params.url;
    }

    if (this.params.validateRequest?.delete) {
      if (!this.params.validateRequest.delete(config?.body)) {
        throw new AdapterRequestError(config, "Invalid request body");
      }
    }

    return this.adapter.request(
      "DELETE",
      url,
      config
        ? extend(config, { validate: this.params.validate?.delete })
        : { validate: this.params.validate?.delete },
      config?.body,
    );
  }

  @Rejects
  options(...args: RequestArguments<Url, SearchParams, XhrReqConfig>) {
    const { config, urlParams } = this.resolveArgs(args);
    this.validateSearchParams(config);

    let url = "";
    if (urlParams) {
      url = this.urlTemplate.generate(urlParams);
    } else {
      url = this.params.url;
    }
    return this.adapter.request(
      "OPTIONS",
      url,
      config
        ? extend(config, { validate: this.params.validate?.options })
        : { validate: this.params.validate?.options },
    );
  }

  url(
    params: UrlLiteralParams<Url>,
    config?: Pick<RequestConfigBase, "baseURL" | "basePath">,
  ): string {
    const templeRes = this.urlTemplate.generate(params);

    let u = this.adapter["prepareUrl"](
      templeRes,
      extend(this.adapter["baseConfig"], config),
    );

    const afterBuildUrl = this.adapter["afterBuildUrl"];
    if (afterBuildUrl) {
      const override = afterBuildUrl(u);
      if (override) {
        u = override;
      }
    }

    return u.toString();
  }
}
