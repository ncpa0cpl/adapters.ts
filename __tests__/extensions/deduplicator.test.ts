import { afterEach, describe, expect, it, vi } from "vitest";
import { Deduplicator } from "../../src/extensions/deduplicator";
import { Adapter, AdapterRequestError } from "../../src/index";

const fetchMock = vi.fn(
  async (url: string, init?: RequestInit): Promise<Response> => {
    throw new Error("fetch mocked");
  },
);
// @ts-ignore
global.fetch = fetchMock;

const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms));

describe("Deduplicator", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should deduplicate same requests", async () => {
    const adapter = Adapter.new();
    new Deduplicator().register(adapter);

    let resolveReq!: (value: Response) => void;
    let rejectReq!: (reason?: any) => void;

    fetchMock.mockImplementation(() => {
      return new Promise<Response>((res, rej) => {
        resolveReq = res;
        rejectReq = rej;
      });
    });

    const resp1Promise = adapter.get("http://localhost/api/devices");
    const resp2Promise = adapter.get("http://localhost/api/devices");
    await sleep(10);
    const resp3Promise = adapter.get("http://localhost/api/devices");

    await sleep(10);

    expect(fetchMock).toHaveBeenCalledTimes(1);

    resolveReq(Response.json({ ok: true }));

    const resp1 = await resp1Promise;
    const resp2 = await resp2Promise;
    const resp3 = await resp3Promise;

    expect(resp1.data).toEqual({ ok: true });
    expect(resp2.data).toEqual({ ok: true });
    expect(resp3.data).toEqual({ ok: true });

    expect(resp1 === resp2).toBe(true);
    expect(resp2 === resp3).toBe(true);

    expect(fetchMock).toHaveBeenCalledTimes(1);

    // after the request was resolved, consecutive requests will be fired
    adapter.get("http://localhost/api/devices");
    await sleep(10);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("timeWindow: should deduplicate requests after being resolved", async () => {
    const adapter = Adapter.new();
    new Deduplicator(500).register(adapter);

    fetchMock.mockImplementation(async () => {
      return Response.json({ ok: true });
    });

    const resp1 = await adapter.get("http://localhost/api/devices");
    expect(resp1.data).toEqual({ ok: true });

    await sleep(100);

    const resp2 = await adapter.get("http://localhost/api/devices");
    expect(resp2.data).toEqual({ ok: true });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(resp1 === resp2).toBe(true);

    await sleep(500);

    const resp3 = await adapter.get("http://localhost/api/devices");
    expect(resp3.data).toEqual({ ok: true });

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(resp2 === resp3).toBe(false);
  });

  it("deduping of failed requests", async () => {
    const adapter = Adapter.new();
    new Deduplicator().register(adapter);

    let resolveReq!: (value: Response) => void;
    let rejectReq!: (reason?: any) => void;

    fetchMock.mockImplementation(() => {
      return new Promise<Response>((res, rej) => {
        resolveReq = res;
        rejectReq = rej;
      });
    });

    const resp1Promise = adapter.get("http://localhost/api/devices");
    const resp2Promise = adapter.get("http://localhost/api/devices");
    await sleep(10);
    const resp3Promise = adapter.get("http://localhost/api/devices");

    await sleep(10);

    expect(fetchMock).toHaveBeenCalledTimes(1);

    rejectReq(new Error("Request failed"));

    await expect(resp1Promise).rejects.toThrow(
      new AdapterRequestError(
        "Unexpected error",
        expect.any(Object),
        "GET",
        "http://localhost/api/devices",
        undefined,
        undefined,
      ),
    );
    await expect(resp2Promise).rejects.toThrow(
      new AdapterRequestError(
        "Unexpected error",
        expect.any(Object),
        "GET",
        "http://localhost/api/devices",
        undefined,
        undefined,
      ),
    );
    await expect(resp3Promise).rejects.toThrow(
      new AdapterRequestError(
        "Unexpected error",
        expect.any(Object),
        "GET",
        "http://localhost/api/devices",
        undefined,
        undefined,
      ),
    );

    expect(fetchMock).toHaveBeenCalledTimes(1);

    // after the request was resolved, consecutive requests will be fired
    const p = adapter.get("http://localhost/api/devices");
    await sleep(10);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    resolveReq(Response.json({ ok: true }));
    await expect(p).resolves.toMatchObject({ data: { ok: true } });
  });
});
