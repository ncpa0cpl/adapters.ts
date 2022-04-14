import { BaseAdapter } from "../BaseAdapter";
import type { _ } from "../substitutor";
import { FetchXHR } from "./fetch-xhr";

export class FetchAdapter extends BaseAdapter {
  protected static readonly xhr = new FetchXHR<_>();
}
