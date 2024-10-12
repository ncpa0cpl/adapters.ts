import { describe, expect, it, vi } from "vitest";
import { Adapter, AdapterResponse } from "../../src";
import { BeforeRequestHandler, DefaultXhrReqConfig } from "../../src/adapter";

const fetchMock = vi.fn(
  async (url: string, init?: RequestInit): Promise<Response> => {
    throw new Error("fetch mocked");
  },
);
// @ts-ignore
global.fetch = fetchMock;

describe("Adapter.endpoint()", () => {
  const adapter = Adapter.new();

  it("simple GET endpoint", async () => {
    fetchMock.mockImplementation(async (url, options) => {
      if (url === "http://127.0.0.1/api/users" && options?.method === "GET") {
        return Response.json([{ name: "John" }]);
      }
      throw new Error("unexpected request");
    });

    const e = adapter.endpoint({
      url: "/api/users",
      validate: {
        get: (data: unknown): data is Array<{ name: string }> => true,
      },
    });

    const resp = await e.get();

    expect(resp.data).toEqual([{ name: "John" }]);
  });

  it("simple GET endpoint with searchParams", async () => {
    fetchMock.mockImplementation(async (url, options) => {
      if (
        url === "http://127.0.0.1/api/list?limit=16&page=69"
        && options?.method === "GET"
      ) {
        return Response.json([{}]);
      }
      throw new Error("unexpected request");
    });

    const e = adapter.endpoint({
      url: "/api/list",
      searchParams: ["page", "limit"],
      validate: {
        get: (data: unknown): data is Array<{ name: string }> => true,
      },
    });

    const resp = await e.get({ searchParams: { limit: "16", page: "69" } });

    expect(resp.data).toEqual([{}]);
  });

  it("parametrized GET endpoint", async () => {
    fetchMock.mockImplementation(async (url, options) => {
      if (
        url === "http://127.0.0.1/api/product/1"
        && options?.method === "GET"
      ) {
        return Response.json({ id: 1 });
      }
      if (
        url === "http://127.0.0.1/api/product/2"
        && options?.method === "GET"
      ) {
        return Response.json({ id: 2 });
      }
      throw new Error("unexpected request");
    });

    const e = adapter.endpoint({
      url: "/api/product/{id}",
      validate: {
        get: (data: unknown): data is { id: number } => true,
      },
    });

    const resp = await e.get({ id: "1" });
    expect(resp.data).toEqual({ id: 1 });

    const resp2 = await e.get({ id: "2" });
    expect(resp2.data).toEqual({ id: 2 });
  });

  it("simple POST endpoint", async () => {
    fetchMock.mockImplementation(async (url, options) => {
      if (
        url === "http://127.0.0.1/api/product"
        && options?.method === "POST"
      ) {
        return Response.json({ ...JSON.parse(options.body as string), id: 1 });
      }
      throw new Error("unexpected request");
    });

    const e = adapter.endpoint({
      url: "/api/product",
      validate: {
        post: (data: unknown): data is Array<{ id: number; name: string }> => true,
      },
      validateRequest: {
        post: (data: unknown): data is { name: string } => true,
      },
    });

    const resp = await e.post({ body: { name: "Johhny" } });

    expect(resp.data).toEqual({ id: 1, name: "Johhny" });
  });

  it("simple POST endpoint eith searchParams", async () => {
    fetchMock.mockImplementation(async (url, options) => {
      const u = new URL(url);

      return Response.json({
        foo: u.searchParams.get("foo"),
        received: JSON.parse(options!.body as string),
      });
    });

    const e = adapter.endpoint({
      url: "/api/product",
      searchParams: ["foo", "?bar"],
      validate: {
        post: (
          data: unknown,
        ): data is { foo: string; received: { bar: string } } => true,
      },
      validateRequest: {
        post: (data: unknown): data is { bar: string } => true,
      },
    });

    const resp = await e.post({
      body: { bar: "1234" },
      searchParams: { foo: "FOO" },
    });

    expect(resp.data).toEqual({ foo: "FOO", received: { bar: "1234" } });
  });

  it("parametrized POST endpoint", async () => {
    fetchMock.mockImplementation(async (url, options) => {
      const u = new URL(url);

      return Response.json({
        param: u.pathname.split("/").pop(),
        received: JSON.parse(options!.body as string),
      });
    });

    const e = adapter.endpoint({
      url: "/api/product/{id}",
      validate: {
        post: (
          data: unknown,
        ): data is { param: string; received: { payload: number } } => true,
      },
      validateRequest: {
        post: (data: unknown): data is { payload: number } => true,
      },
    });

    const resp = await e.post({ id: "69" }, { body: { payload: 420 } });

    expect(resp.data).toEqual({ param: "69", received: { payload: 420 } });
  });

  it("response validation", async () => {
    fetchMock.mockImplementation(async (url, options) => {
      return Response.json(JSON.parse((options!.body as string) ?? "null"));
    });

    const validate = (v: unknown): v is { prop: string } => {
      return (
        typeof v === "object"
        && v !== null
        && "prop" in v
        && typeof v["prop"] === "string"
      );
    };

    const e = adapter.endpoint({
      url: "/api/product",
      validate: {
        get: validate,
        post: validate,
      },
    });

    await expect(e.get()).rejects.toThrow("Invalid response data");
    await expect(e.post({ body: {} })).rejects.toThrow("Invalid response data");
    await expect(e.post({ body: { prop: "value" } })).resolves.toMatchObject({
      data: {
        prop: "value",
      },
    });
  });

  it("request valudation", async () => {
    fetchMock.mockImplementation(async (url, options) => {
      return Response.json(JSON.parse((options!.body as string) ?? "null"));
    });

    const validate = (v: unknown): v is { prop: string } => {
      return (
        typeof v === "object"
        && v !== null
        && "prop" in v
        && typeof v["prop"] === "string"
      );
    };

    const e = adapter.endpoint({
      url: "/api/product",
      validate: {
        post: validate,
      },
      validateRequest: {
        post: validate,
      },
    });

    // @ts-expect-error
    await expect(e.post({ body: {} })).rejects.toThrow("Invalid request body");
    await expect(e.post({ body: { prop: "value" } })).resolves.toMatchObject({
      data: {
        prop: "value",
      },
    });
  });

  it("search params validation", async () => {
    fetchMock.mockImplementation(async (url, options) => {
      return Response.json(JSON.parse((options!.body as string) ?? "null"));
    });

    const e = adapter.endpoint({
      url: "/api/product",
      searchParams: ["?foo", "bar", "baz", "?qux"],
    });

    // @ts-ignore
    await expect(e.get({ searchParams: { foo: "foo" } })).rejects.toThrow(
      "Missing a required search param: bar",
    );
    await expect(
      // @ts-ignore
      e.get({ searchParams: { foo: "foo", bar: "bar" } }),
    ).rejects.toThrow("Missing a required search param: baz");
    await expect(
      // @ts-ignore
      e.get({ searchParams: { bar: "bar", baz: "baz" } }),
    ).resolves.toBeDefined();
    await expect(
      // @ts-ignore
      e.get({
        searchParams: { foo: "foo", bar: "bar", baz: "baz", qux: "qux" },
      }),
    ).resolves.toBeDefined();
  });

  it("override adapter config", async () => {
    let requestedURL: string | null = null;
    fetchMock.mockImplementation(async (url, options) => {
      requestedURL = url;
      return Response.json(JSON.parse((options!.body as string) ?? "null"));
    });

    const afterBuildUrl = vi.fn((u: URL) => u);
    const afterResponse = vi.fn((r: AdapterResponse<any, any>) => r);
    const beforeRequest = vi.fn<BeforeRequestHandler<any>>((u, c, b) => [u, c, b]);
    const onRequestError = vi.fn(err => err);

    const adapter = Adapter.new<DefaultXhrReqConfig>({
      basePath: "api/devices",
      baseURL: "https://mydomain.com",
      defaultAutoRetry: 2,
      defaultHeaders: {
        "X-My-Header": "value",
        "X-My-Header-2": "value2",
      },
      defaultRetryDelay: 1000,
      defaultTimeout: 5000,
      defaultXhr: {
        credentials: "include",
        responseType: "json",
      },
      onAfterBuildUrl: [afterBuildUrl],
      onAfterResponse: [afterResponse],
      onBeforeRequest: [beforeRequest],
      onRequestError: [onRequestError],
    });

    const endpAfterBuildUrl = vi.fn((u: URL) => u);
    const endpAfterResponse = vi.fn((r: AdapterResponse<any, any>) => r);
    const endpBeforeRequest = vi.fn<BeforeRequestHandler<any>>((u, c, b) => [u, c, b]);
    const endpRequestError = vi.fn(err => err);
    const e = adapter.endpoint({
      url: "{deviceID}/info",
      options: {
        defaultTimeout: 0,
        defaultAutoRetry: 0,
        baseURL: "https://myotherdomain.com",
        defaultHeaders: {
          "X-My-Header": "NONE",
          "X-My-Header-3": "value3",
        },
        defaultXhr: {
          credentials: "same-origin",
          referrer: "no-referrer",
        },
        onAfterBuildUrl: [endpAfterBuildUrl],
        onAfterResponse: [endpAfterResponse],
        onBeforeRequest: [endpBeforeRequest],
        onRequestError: [endpRequestError],
      },
    });

    const endpConfig = e["adapter"]["baseConfig"];
    const endpHeaders = e["adapter"]["baseHeaders"];

    // assert configs and headers get merged correctly
    expect(endpConfig.basePath).toBe("api/devices");
    expect(endpConfig.baseURL).toBe("https://myotherdomain.com");
    expect(endpConfig.autoRetry).toBe(0);
    expect(endpConfig.retryDelay).toBe(1000);
    expect(endpConfig.timeout).toBe(0);
    expect(endpConfig.xhr).toMatchObject({
      credentials: "same-origin",
      responseType: "json",
      referrer: "no-referrer",
    });
    expect(endpHeaders.get("X-My-Header")).toBe("NONE");
    expect(endpHeaders.get("X-My-Header-2")).toBe("value2");
    expect(endpHeaders.get("X-My-Header-3")).toBe("value3");

    // assert all callbacks are called

    await e.get({ deviceID: "1234" }, { body: {} });

    expect(requestedURL).toBe("https://myotherdomain.com/api/devices/1234/info");
    expect(afterBuildUrl).toBeCalledTimes(1);
    expect(afterResponse).toBeCalledTimes(1);
    expect(beforeRequest).toBeCalledTimes(1);
    expect(onRequestError).toBeCalledTimes(0);
    expect(endpAfterBuildUrl).toBeCalledTimes(1);
    expect(endpAfterResponse).toBeCalledTimes(1);
    expect(endpBeforeRequest).toBeCalledTimes(1);
    expect(endpRequestError).toBeCalledTimes(0);

    fetchMock.mockImplementation(async (url, options) => {
      return Response.error();
    });

    await e.get({ deviceID: "1234" }, { body: {} }).catch(() => {});

    expect(onRequestError).toBeCalledTimes(1);
    expect(endpRequestError).toBeCalledTimes(1);
  });

  it("url generate", () => {
    const adapter = Adapter.new({
      baseURL: "https://mydomain.com/",
      basePath: "api",
    });

    const e1 = adapter.endpoint({
      url: "/product/{id}/info",
    });
    expect(e1.url({ id: "532" })).toBe("https://mydomain.com/api/product/532/info");

    const e2 = adapter.endpoint({
      url: "/product/{id}",
      searchParams: ["?goo"],
    });
    expect(e2.url({ id: "MY_ID" })).toBe("https://mydomain.com/api/product/MY_ID");
    expect(e2.url({ id: "MY_ID" }, { searchParams: { "goo": "true" } })).toBe(
      "https://mydomain.com/api/product/MY_ID?goo=true",
    );

    const e3 = adapter.endpoint({
      url: "/product/{id}/list",
      searchParams: ["search", "?page"],
    });
    expect(e3.url({ id: "ABC" }, { searchParams: { search: "foobar" } })).toBe(
      "https://mydomain.com/api/product/ABC/list?search=foobar",
    );
    expect(e3.url({ id: "ABC" }, { searchParams: { search: "foobar", page: "2" } })).toBe(
      "https://mydomain.com/api/product/ABC/list?search=foobar&page=2",
    );

    const e4 = adapter.endpoint({
      url: "/products",
    });
    expect(e4.url()).toBe("https://mydomain.com/api/products");

    const e5 = adapter.endpoint({
      url: "/products",
      searchParams: ["?search", "?page"],
    });
    expect(e5.url()).toBe("https://mydomain.com/api/products");
    expect(e5.url({ searchParams: { page: "123" } })).toBe("https://mydomain.com/api/products?page=123");

    const e6 = adapter.endpoint({
      url: "/products",
      searchParams: ["search", "?page"],
    });
    expect(e6.url({ searchParams: { "search": "hello" } })).toBe("https://mydomain.com/api/products?search=hello");
    expect(e6.url({ searchParams: { "search": "hello", "page": "69" } })).toBe(
      "https://mydomain.com/api/products?search=hello&page=69",
    );
  });
});
