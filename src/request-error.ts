import { RequestConfig } from ".";

export class AdapterRequestError extends Error {
  static is(err: unknown): err is AdapterRequestError {
    return err instanceof AdapterRequestError;
  }

  public declare cause?: unknown;

  constructor(
    public readonly config: RequestConfig<any, any> | undefined,
    reason: string,
    status?: number,
    cause?: any,
  ) {
    console.log(cause);
    super(reason, { cause });
    this.name = "AdapterRequestError";
  }
}
