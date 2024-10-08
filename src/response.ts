import { Adapter } from "./adapter";
import { RequestMethod } from "./xhr-interface";

export class AdapterResponse<XhrResp = Response, T = unknown> {
  static is<U = unknown>(v: unknown): v is AdapterResponse<any, U> {
    return v instanceof AdapterResponse;
  }

  constructor(
    public readonly adapter: Adapter<any, XhrResp>,
    public readonly method: RequestMethod,
    public readonly url: URL,
    public readonly config: any,
    public readonly data: T,
    public readonly response: XhrResp,
  ) {}
}
