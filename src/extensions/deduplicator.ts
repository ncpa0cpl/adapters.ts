import { Adapter, BeforeRequestHandler, DefaultXhrReqConfig, RequestConfig } from "../adapter";
import { AdapterResponse } from "../response";
import { RequestMethod } from "../xhr-interface";

type Resolvable = [
  (value: AdapterResponse<any, any> | PromiseLike<AdapterResponse<any, any>>) => void,
  (reason?: any) => void,
];

function yes() {
  return true;
}

class PendingRequest {
  private done = false;
  private result?: AdapterResponse<any, any>;
  private reason?: any;

  private resolvables: Array<Resolvable> = [];

  failed() {
    return this.done && !this.result;
  }

  getResolvable(): Promise<AdapterResponse<any, any>> {
    return new Promise<AdapterResponse<any, any>>((resolve, reject) => {
      if (this.done) {
        if (this.result) {
          resolve(this.result);
        } else {
          reject(this.reason);
        }
      } else {
        this.resolvables.push([resolve, reject]);
      }
    });
  }

  resolve(response: AdapterResponse<any, any>) {
    this.done = true;
    this.result = response;
    this.resolvables.forEach(([resolve]) => resolve(response));
  }

  reject(reason: any) {
    this.done = true;
    this.reason = reason;
    this.resolvables.forEach(([, reject]) => reject(reason));
  }
}

export class Deduplicator {
  private static globalInstance: Deduplicator;

  static register(adapter: Adapter) {
    Deduplicator.globalInstance.register(adapter);
  }

  static unregister(adapter: Adapter) {
    Deduplicator.globalInstance.unregister(adapter);
  }

  private connectedAdapters = new Map<Adapter, BeforeRequestHandler<any>>();
  private pendingRequests = new Map<string, PendingRequest>();

  constructor(
    /**
     * Amount of time after which the request will be forgotten. By defualt a request will be
     * deduplicated only if the same request is made when there is a in-flight one that is sent
     * to the same endpoint. By changing this setting it's possible to deduplicate requests that
     * have been already been resolved within a certain time window.
     */
    private readonly timeWindow?: number,
    private readonly shouldDedup: (
      url: URL,
      config: RequestConfig<DefaultXhrReqConfig, unknown>,
    ) => boolean = yes,
  ) {}

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
      if (method === "GET" && this.shouldDedup(url, config)) {
        const key = url.toString();
        const pending = this.pendingRequests.get(key);
        if (pending) {
          return pending.getResolvable();
        } else {
          const pending = new PendingRequest();
          this.pendingRequests.set(key, pending);

          adapter["requestInternal"](
            method,
            url,
            config,
            body,
            config.autoRetry ? config.autoRetry - 1 : undefined,
          )
            .then(resp => pending.resolve(resp))
            .catch(err => pending.reject(err))
            .finally(() => {
              if (this.timeWindow && !pending.failed()) {
                setTimeout(() => {
                  this.pendingRequests.delete(key);
                }, this.timeWindow);
              } else {
                this.pendingRequests.delete(key);
              }
            });

          return pending.getResolvable();
        }
      }
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

Deduplicator["globalInstance"] = new Deduplicator();
