declare global {
  interface AdaptersTs {}
}

type ErrType<T> = AdaptersTs extends { TypedPromises: true } ? T : any;

/**
 * Represents the completion of an asynchronous operation
 */
export interface TypedPromise<T, Err = unknown> extends Promise<T> {
  /**
   * Attaches callbacks for the resolution and/or rejection of the Promise.
   * @param onfulfilled The callback to execute when the Promise is resolved.
   * @param onrejected The callback to execute when the Promise is rejected.
   * @returns A Promise for the completion of which ever callback is executed.
   */
  then<TResult1 = T, TResult2 = never, ErrResult = Err>(
    onfulfilled?:
      | ((value: T) => TResult1 | PromiseLike<TResult1>)
      | undefined
      | null,
    onrejected?:
      | ((reason: ErrType<Err>) => TResult2 | PromiseLike<TResult2>)
      | undefined
      | null,
  ): TypedPromise<TResult1 | TResult2, ErrResult>;

  /**
   * Attaches a callback for only the rejection of the Promise.
   * @param onrejected The callback to execute when the Promise is rejected.
   * @returns A Promise for the completion of the callback.
   */
  catch<TResult = never, ErrResult = unknown>(
    onrejected?:
      | ((reason: ErrType<Err>) => TResult | PromiseLike<TResult>)
      | undefined
      | null,
  ): TypedPromise<T | TResult, ErrResult>;
}
