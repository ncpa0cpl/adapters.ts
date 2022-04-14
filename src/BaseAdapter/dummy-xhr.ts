import type { XHRInterface } from "./types";

export class DummyXHR implements XHRInterface {
  sendRequest(): Promise<any> {
    throw new Error("Method not implemented.");
  }
  extractPayload(): Promise<unknown> {
    throw new Error("Method not implemented.");
  }
}
