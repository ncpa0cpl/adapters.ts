import { RequestConfig } from ".";

export class AdapterRequestError extends Error {
  static is(err: unknown): err is AdapterRequestError {
    return err instanceof AdapterRequestError;
  }

  declare public cause?: unknown;

  constructor(
    public readonly config: RequestConfig<any, any> | undefined,
    reason: string,
    status?: number,
    cause?: any,
  ) {
    super(reason, { cause });
    this.name = "AdapterRequestError";
  }
}
