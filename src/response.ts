import { Adapter } from "./adapter";

export class AdapterResponse<XhrResp = Response, T = unknown> {
  static is<U = unknown>(v: unknown): v is AdapterResponse<any, U> {
    return v instanceof AdapterResponse;
  }

  constructor(
    public readonly adapter: Adapter<any, XhrResp>,
    public readonly config: any,
    public readonly data: T,
    public readonly response: XhrResp,
  ) {}
}
