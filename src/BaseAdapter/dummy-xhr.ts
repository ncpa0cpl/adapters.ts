import type { XHRInterface } from "./types";

export class DummyXHR implements XHRInterface<any> {
  sendRequest(): Promise<any> {
    throw new Error("Method not implemented.");
  }
  extractPayload(): Promise<unknown> {
    throw new Error("Method not implemented.");
  }
}
