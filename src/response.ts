import { Adapter } from "./adapter";

export class AdapterResponse<XhrResp = Response, T = unknown> {
  constructor(
    public readonly adapter: Adapter<any, XhrResp>,
    public readonly config: any,
    public readonly data: T,
    public readonly response: XhrResp,
  ) {}
}
