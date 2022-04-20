import { BaseAdapter } from "../BaseAdapter";
import { AxiosXHR } from "./axios-xhr";

export class AxiosAdapter extends BaseAdapter {
  protected static readonly xhr = new AxiosXHR();
}
