import { Queue } from "async-await-queue";
import { Adapter, BeforeRequestHandler, DefaultXhrReqConfig, RequestConfig } from "../adapter";
import { RequestMethod } from "../xhr-interface";

export class AsyncQueue {
  private connectedAdapters = new Map<Adapter, BeforeRequestHandler<any>>();

  private queue;
  constructor(maxConcurrent: number) {
    this.queue = new Queue(maxConcurrent, 0);
  }

  register(adapter: Adapter) {
    if (this.connectedAdapters.has(adapter)) {
      return;
    }

    const handlerCb = (
      url: URL,
      config: RequestConfig<DefaultXhrReqConfig, unknown>,
      body: unknown,
      method: RequestMethod,
    ) => {
      let priority = 0;
      if (
        config.xhr
        && "priority" in config.xhr
        && typeof config.xhr.priority === "number"
      ) {
        priority = config.xhr.priority;
      }

      return this.queue.run(() =>
        adapter["requestInternal"](
          method,
          url,
          config,
          body,
          config.autoRetry ? config.autoRetry - 1 : undefined,
        ), priority);
    };

    adapter.addHandler(
      "beforeRequest",
      handlerCb,
    );

    this.connectedAdapters.set(adapter, handlerCb);
  }

  unregister(adapter: Adapter) {
    const handlerCb = this.connectedAdapters.get(adapter);
    if (handlerCb) {
      adapter.removeHandler("beforeRequest", handlerCb);
      this.connectedAdapters.delete(adapter);
    }
  }
}
