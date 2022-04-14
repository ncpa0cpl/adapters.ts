import type { GetDataType } from "dilswer";
import type { UrlLiteralParams } from "url-templater.ts";
import type { UrlTemplate } from "url-templater.ts/dist/url-template.types";
import type { $ } from "../substitutor";
import type { BaseAdapter } from "./base-adapter";

export type RequestMethod =
  | "DELETE"
  | "GET"
  | "OPTIONS"
  | "PATCH"
  | "POST"
  | "PUT";

export type XHRInterface = {
  sendRequest(params: {
    type: RequestMethod;
    url: string;
    data?: Record<string, any>;
    config?: any;
  }): Promise<any>;

  extractPayload(response: any): Promise<unknown>;
};

type ConfigFor<I extends typeof BaseAdapter> = Exclude<
  // @ts-expect-error
  Parameters<I["xhr"]["sendRequest"]>[0]["config"],
  undefined
>;

type UrlParamsFor<I extends typeof BaseAdapter> = UrlLiteralParams<
  I["URL_TEMPLATE"]
>;

export type RequestOptions<Data, Config> = {
  config?: Config;
  data?: Data;
};

type ArgsTuple<
  Data,
  Params extends Record<string, string> | Record<string, never>,
  Config
> = Params extends Record<string, never>
  ? unknown extends Data
    ? [
        options?: {
          config?: Config;
        }
      ]
    : [
        options: {
          config?: Config;
          data: Data;
        }
      ]
  : unknown extends Data
  ? [
      queryParams: Params,
      options?: {
        config?: Config;
      }
    ]
  : [
      queryParams: Params,
      options?: {
        config?: Config;
        data: Data;
      }
    ];

export type ArgsFor<A extends typeof BaseAdapter, T extends RequestMethod> = {
  GET: ArgsTuple<
    GetDataType<A["GET_REQUEST_TYPE_DEF"]>,
    UrlParamsFor<A>,
    ConfigFor<A>
  >;
  POST: ArgsTuple<
    GetDataType<A["POST_REQUEST_TYPE_DEF"]>,
    UrlParamsFor<A>,
    ConfigFor<A>
  >;
  DELETE: ArgsTuple<
    GetDataType<A["DELETE_REQUEST_TYPE_DEF"]>,
    UrlParamsFor<A>,
    ConfigFor<A>
  >;
  OPTIONS: ArgsTuple<
    GetDataType<A["OPTIONS_REQUEST_TYPE_DEF"]>,
    UrlParamsFor<A>,
    ConfigFor<A>
  >;
  PATCH: ArgsTuple<
    GetDataType<A["PATCH_REQUEST_TYPE_DEF"]>,
    UrlParamsFor<A>,
    ConfigFor<A>
  >;
  PUT: ArgsTuple<
    GetDataType<A["PUT_REQUEST_TYPE_DEF"]>,
    UrlParamsFor<A>,
    ConfigFor<A>
  >;
}[T];

export type ResultTypeFor<
  A extends typeof BaseAdapter,
  T extends RequestMethod
> = {
  GET: GetDataType<A["GET_RESPONSE_TYPE_DEF"]>;
  POST: GetDataType<A["POST_RESPONSE_TYPE_DEF"]>;
  DELETE: GetDataType<A["DELETE_RESPONSE_TYPE_DEF"]>;
  OPTIONS: GetDataType<A["OPTIONS_RESPONSE_TYPE_DEF"]>;
  PATCH: GetDataType<A["PATCH_RESPONSE_TYPE_DEF"]>;
  PUT: GetDataType<A["PUT_RESPONSE_TYPE_DEF"]>;
}[T];

export type ResultFor<
  A extends typeof BaseAdapter,
  T extends RequestMethod
> = Promise<
  ReturnType<
    $<
      // @ts-expect-error
      A["xhr"],
      [
        {
          GET: GetDataType<A["GET_RESPONSE_TYPE_DEF"]>;
          POST: GetDataType<A["POST_RESPONSE_TYPE_DEF"]>;
          DELETE: GetDataType<A["DELETE_RESPONSE_TYPE_DEF"]>;
          OPTIONS: GetDataType<A["OPTIONS_RESPONSE_TYPE_DEF"]>;
          PATCH: GetDataType<A["PATCH_RESPONSE_TYPE_DEF"]>;
          PUT: GetDataType<A["PUT_RESPONSE_TYPE_DEF"]>;
        }[T]
      ]
    >["sendRequest"]
  >
>;

export type InternalOptions = {
  config?: any;
  data?: any;
  urlParameters: Record<string, string>;
};

export type InternalAdapterUrlGenerator = undefined | UrlTemplate<string>;
