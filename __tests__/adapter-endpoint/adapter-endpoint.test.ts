import { describe, expect, it, vi } from "vitest";
import { Adapter } from "../../src";

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
      console.log(url);
      if (
        url === "http://127.0.0.1/api/list?limit=16&page=69" &&
        options?.method === "GET"
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
        url === "http://127.0.0.1/api/product/1" &&
        options?.method === "GET"
      ) {
        return Response.json({ id: 1 });
      }
      if (
        url === "http://127.0.0.1/api/product/2" &&
        options?.method === "GET"
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
        url === "http://127.0.0.1/api/product" &&
        options?.method === "POST"
      ) {
        return Response.json({ ...JSON.parse(options.body as string), id: 1 });
      }
      throw new Error("unexpected request");
    });

    const e = adapter.endpoint({
      url: "/api/product",
      validate: {
        post: (data: unknown): data is Array<{ id: number; name: string }> =>
          true,
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
        typeof v === "object" &&
        v !== null &&
        "prop" in v &&
        typeof v["prop"] === "string"
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
        typeof v === "object" &&
        v !== null &&
        "prop" in v &&
        typeof v["prop"] === "string"
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
});
