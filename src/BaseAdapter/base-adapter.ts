import type { AllDataTypes } from "dilswer";
import { createValidator, DataType } from "dilswer";
import { urlTemplate } from "url-templater.ts";
import { DummyXHR } from "./dummy-xhr";
import type {
  ArgsFor,
  InternalAdapterUrlGenerator,
  InternalOptions,
  RequestMethod,
  RequestOptions,
  ResultFor,
  UrlParamsFor,
  XHRInterface,
} from "./types";

export abstract class BaseAdapter {
  protected static readonly xhr: XHRInterface<any> = new DummyXHR();
  private static urlGenerator: InternalAdapterUrlGenerator = undefined;

  private static getUrlGenerator() {
    if (!this.urlGenerator) this.urlGenerator = urlTemplate(this.URL_TEMPLATE);

    return this.urlGenerator!;
  }

  private static parseArguments<T extends typeof BaseAdapter>(
    this: T,
    args:
      | [options?: RequestOptions<any, any>]
      | [params: Record<string, string>, options?: RequestOptions<any, any>]
  ): InternalOptions {
    if (args.length === 1) {
      if (this.getUrlGenerator().parametersCount > 0) {
        return {
          urlParameters: args[0]!,
        };
      }
      return {
        ...args[0],
        urlParameters: {},
      };
    } else if (args.length === 2) {
      return {
        ...args[1],
        urlParameters: args[0],
      };
    }

    return {
      urlParameters: {},
    };
  }

  private static getMethodResponseDataTypeDef(
    method: RequestMethod
  ): AllDataTypes {
    switch (method) {
      case "DELETE":
        return this.DELETE_RESPONSE_TYPE_DEF;
      case "GET":
        return this.GET_RESPONSE_TYPE_DEF;
      case "OPTIONS":
        return this.OPTIONS_RESPONSE_TYPE_DEF;
      case "PATCH":
        return this.PATCH_RESPONSE_TYPE_DEF;
      case "POST":
        return this.POST_RESPONSE_TYPE_DEF;
      case "PUT":
        return this.PUT_RESPONSE_TYPE_DEF;
    }
  }

  private static getMethodRequestDataTypeDef(
    method: RequestMethod
  ): AllDataTypes {
    switch (method) {
      case "DELETE":
        return this.DELETE_REQUEST_TYPE_DEF;
      case "GET":
        return this.GET_REQUEST_TYPE_DEF;
      case "OPTIONS":
        return this.OPTIONS_REQUEST_TYPE_DEF;
      case "PATCH":
        return this.PATCH_REQUEST_TYPE_DEF;
      case "POST":
        return this.POST_REQUEST_TYPE_DEF;
      case "PUT":
        return this.PUT_REQUEST_TYPE_DEF;
    }
  }

  private static async validateResponse(
    response: any,
    method: RequestMethod
  ): Promise<void> {
    if (!this.VALIDATE_RESPONSES) return;

    const dt = this.getMethodResponseDataTypeDef(method);
    if (dt === DataType.Unknown) return;

    const validate = createValidator(dt);

    const success = validate(await this.xhr.extractPayload(response));

    if (!success) {
      throw new TypeError(
        "Adapter error: invalid response data. Response received from the server does not match the type definition."
      );
    }
  }

  private static validateRequest(
    requestData: any,
    method: RequestMethod
  ): void {
    if (!this.VALIDATE_REQUESTS) return;

    const dt = this.getMethodRequestDataTypeDef(method);
    if (dt === DataType.Unknown) return;

    const validate = createValidator(dt);

    const success = validate(requestData);

    if (!success) {
      throw new TypeError(
        "Adapter error: invalid request data. Data provided to the xhr request does not match the type definition."
      );
    }
  }

  static readonly URL_TEMPLATE: string = "";
  static readonly VALIDATE_RESPONSES: boolean = true;
  static readonly VALIDATE_REQUESTS: boolean = false;

  static readonly DELETE_REQUEST_TYPE_DEF: AllDataTypes = DataType.Unknown;
  static readonly GET_REQUEST_TYPE_DEF: AllDataTypes = DataType.Unknown;
  static readonly OPTIONS_REQUEST_TYPE_DEF: AllDataTypes = DataType.Unknown;
  static readonly PATCH_REQUEST_TYPE_DEF: AllDataTypes = DataType.Unknown;
  static readonly POST_REQUEST_TYPE_DEF: AllDataTypes = DataType.Unknown;
  static readonly PUT_REQUEST_TYPE_DEF: AllDataTypes = DataType.Unknown;

  static readonly DELETE_RESPONSE_TYPE_DEF: AllDataTypes = DataType.Unknown;
  static readonly GET_RESPONSE_TYPE_DEF: AllDataTypes = DataType.Unknown;
  static readonly OPTIONS_RESPONSE_TYPE_DEF: AllDataTypes = DataType.Unknown;
  static readonly PATCH_RESPONSE_TYPE_DEF: AllDataTypes = DataType.Unknown;
  static readonly POST_RESPONSE_TYPE_DEF: AllDataTypes = DataType.Unknown;
  static readonly PUT_RESPONSE_TYPE_DEF: AllDataTypes = DataType.Unknown;

  private static async sendRequest<
    T extends typeof BaseAdapter,
    M extends RequestMethod
  >(this: T, method: M, args: ArgsFor<T, M>): Promise<ResultFor<T, M>> {
    const { urlParameters, config, data } = this.parseArguments(args);
    const url = this.generateUrl(urlParameters as any);

    this.validateRequest(data, method);

    const response = await this.xhr.sendRequest({
      method: method,
      url,
      config,
      data,
    });

    await this.validateResponse(response, method);

    return response;
  }

  static generateUrl<T extends typeof BaseAdapter>(
    this: T,
    params: UrlParamsFor<T>
  ): string {
    return this.getUrlGenerator().generate(params);
  }

  static async delete<T extends typeof BaseAdapter>(
    this: T,
    ...args: ArgsFor<T, "DELETE">
  ): Promise<ResultFor<T, "DELETE">> {
    return this.sendRequest("DELETE", args);
  }

  static async get<T extends typeof BaseAdapter>(
    this: T,
    ...args: ArgsFor<T, "GET">
  ): Promise<ResultFor<T, "GET">> {
    return this.sendRequest("GET", args);
  }

  static async options<T extends typeof BaseAdapter>(
    this: T,
    ...args: ArgsFor<T, "OPTIONS">
  ): Promise<ResultFor<T, "OPTIONS">> {
    return this.sendRequest("OPTIONS", args);
  }

  static async patch<T extends typeof BaseAdapter>(
    this: T,
    ...args: ArgsFor<T, "PATCH">
  ): Promise<ResultFor<T, "PATCH">> {
    return this.sendRequest("PATCH", args);
  }

  static async post<T extends typeof BaseAdapter>(
    this: T,
    ...args: ArgsFor<T, "POST">
  ): Promise<ResultFor<T, "POST">> {
    return this.sendRequest("POST", args);
  }

  static async put<T extends typeof BaseAdapter>(
    this: T,
    ...args: ArgsFor<T, "PUT">
  ): Promise<ResultFor<T, "PUT">> {
    return this.sendRequest("PUT", args);
  }
}
