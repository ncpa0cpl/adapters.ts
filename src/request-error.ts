import { RequestConfig } from ".";
import { RequestMethod } from "./xhr-interface";

export class AdapterRequestError<XhrResp = Response> extends Error {
  static is(err: unknown): err is AdapterRequestError {
    return err instanceof AdapterRequestError;
  }

  declare public cause?: unknown;

  constructor(
    reason: string,
    public readonly config?: RequestConfig<any, any> | undefined,
    public readonly method?: RequestMethod,
    public readonly url?: string,
    public readonly status?: number,
    public readonly xhrResponse?: XhrResp,
    cause?: unknown,
  ) {
    super(reason, { cause });
    this.name = "AdapterRequestError";
  }
}
