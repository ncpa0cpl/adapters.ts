import { describe, expect, it, vi } from "vitest";
import { Adapter, adapter } from "../src/index";

const fetchMock = vi.fn(
  async (url: string, init?: RequestInit): Promise<Response> => {
    throw new Error("fetch mocked");
  },
);
// @ts-ignore
global.fetch = fetchMock;

describe("Adapter", () => {
  it("GET simple", async () => {
    fetchMock.mockImplementation(async (url, options) => {
      if (url === "http://127.0.0.1/api/list" && options?.method === "GET") {
        return Response.json(["a", "b", "c"]);
      }
      throw new Error("unexpected request");
    });

    const e = await adapter.get("/api/list");

    expect(e.data).toEqual(["a", "b", "c"]);
  });

  it("GET validated", async () => {
    fetchMock.mockImplementation(async (url, options) => {
      if (url === "http://127.0.0.1/api/list" && options?.method === "GET") {
        return Response.json(["a", "b", "c"]);
      }
      throw new Error("unexpected request");
    });

    const e = await adapter.get("/api/list", {
      validate(data): data is string[] {
        return Array.isArray(data);
      },
    });

    expect(e.data).toEqual(["a", "b", "c"]);

    fetchMock.mockImplementation(async (url, options) => {
      if (url === "http://127.0.0.1/api/list" && options?.method === "GET") {
        return Response.json({});
      }
      throw new Error("unexpected request");
    });

    await expect(
      adapter.get("/api/list", {
        validate(data): data is string[] {
          return Array.isArray(data);
        },
      }),
    ).rejects.toThrow("Invalid response data");
  });

  it("GET with search params", async () => {
    fetchMock.mockImplementation(async (url, options) => {
      if (
        url === "http://127.0.0.1/api/list?page=2&limit=12"
        && options?.method === "GET"
      ) {
        return Response.json(["a", "b", "c"]);
      }
      throw new Error("unexpected request");
    });

    const e = await adapter.get("/api/list", {
      searchParams: {
        page: "2",
        limit: "12",
      },
    });

    expect(e.data).toEqual(["a", "b", "c"]);
  });

  describe("request options", () => {
    it("timeout", async () => {
      fetchMock.mockImplementation(async (url, options) => {
        return new Promise((resp, reject) => {
          if (options?.signal) {
            options.signal.onabort = () => {
              reject(options.signal?.reason);
            };
          }
        });
      });

      await expect(adapter.get("/api/list", { timeout: 100 })).rejects.toThrow(
        "Request aborted, timeout exceeded",
      );
    });

    it("retries and succeeds", async () => {
      let count = 0;
      fetchMock.mockImplementation(async (url, options) => {
        if (count === 2) {
          return Response.json(["a", "b", "c"]);
        }
        if (count === 0) {
          count++;
          return new Response(null, {
            status: 500,
            statusText: "Internal Server Error",
          });
        } else {
          count++;
          throw new Error("fetch error");
        }
      });

      const e = await adapter.get("/api/list", { autoRetry: 3 });

      expect(e.data).toEqual(["a", "b", "c"]);
    });

    it("retries and fails", async () => {
      let count = 0;
      fetchMock.mockImplementation(async (url, options) => {
        count++;
        return new Response(null, {
          status: 500,
          statusText: "Internal Server Error",
        });
      });

      await expect(adapter.get("/api/list", { autoRetry: 3 })).rejects.toThrow(
        "Server error: [500] Internal Server Error",
      );
      expect(count).toBe(3);
    });

    it("baseURL", async () => {
      fetchMock.mockImplementation(async (url, options) => {
        if (
          url === "https://my-domain.com/api/list"
          && options?.method === "GET"
        ) {
          return Response.json(["a", "b", "c"]);
        }
        throw new Error("unexpected request");
      });

      const e = await adapter.get("/api/list", {
        baseURL: "https://my-domain.com",
      });

      expect(e.data).toEqual(["a", "b", "c"]);
    });

    it("basePath", async () => {
      fetchMock.mockImplementation(async (url, options) => {
        if (url === "http://127.0.0.1/api/list" && options?.method === "GET") {
          return Response.json(["a", "b", "c"]);
        }
        throw new Error("unexpected request");
      });

      const e = await adapter.get("/list", {
        basePath: "/api/",
      });

      expect(e.data).toEqual(["a", "b", "c"]);
    });

    it("baseURL + basePath", async () => {
      fetchMock.mockImplementation(async (url, options) => {
        if (
          url === "https://my-domain.com/api/list"
          && options?.method === "GET"
        ) {
          return Response.json(["a", "b", "c"]);
        }
        throw new Error("unexpected request");
      });

      const e = await adapter.get("/list", {
        baseURL: "https://my-domain.com",
        basePath: "/api/",
      });

      expect(e.data).toEqual(["a", "b", "c"]);
    });
  });

  describe("default request options", () => {
    it("timeout", async () => {
      const adapter = Adapter.new({ defaultTimeout: 100 });

      fetchMock.mockImplementation(async (url, options) => {
        return new Promise((resp, reject) => {
          if (options?.signal) {
            options.signal.onabort = () => {
              reject(options.signal?.reason);
            };
          }
        });
      });

      await expect(adapter.get("/api/list")).rejects.toThrow(
        "Request aborted, timeout exceeded",
      );
    });

    it("retries and succeeds", async () => {
      const adapter = Adapter.new({ defaultAutoRetry: 3 });

      let count = 0;
      fetchMock.mockImplementation(async (url, options) => {
        if (count === 2) {
          return Response.json(["a", "b", "c"]);
        }
        if (count === 0) {
          count++;
          return new Response(null, {
            status: 500,
            statusText: "Internal Server Error",
          });
        } else {
          count++;
          throw new Error("fetch error");
        }
      });

      const e = await adapter.get("/api/list");

      expect(e.data).toEqual(["a", "b", "c"]);
    });

    it("retries and fails", async () => {
      const adapter = Adapter.new({ defaultAutoRetry: 3 });

      let count = 0;
      fetchMock.mockImplementation(async (url, options) => {
        count++;
        return new Response(null, {
          status: 500,
          statusText: "Internal Server Error",
        });
      });

      await expect(adapter.get("/api/list")).rejects.toThrow(
        "Server error: [500] Internal Server Error",
      );
      expect(count).toBe(3);
    });

    it("baseURL", async () => {
      const adapter = Adapter.new({
        baseURL: "https://my-domain.com",
      });

      fetchMock.mockImplementation(async (url, options) => {
        if (
          url === "https://my-domain.com/api/list"
          && options?.method === "GET"
        ) {
          return Response.json(["a", "b", "c"]);
        }
        throw new Error("unexpected request");
      });

      const e = await adapter.get("/api/list");

      expect(e.data).toEqual(["a", "b", "c"]);
    });

    it("basePath", async () => {
      const adapter = Adapter.new({
        basePath: "/api/",
      });

      fetchMock.mockImplementation(async (url, options) => {
        if (url === "http://127.0.0.1/api/list" && options?.method === "GET") {
          return Response.json(["a", "b", "c"]);
        }
        throw new Error("unexpected request");
      });

      const e = await adapter.get("/list");

      expect(e.data).toEqual(["a", "b", "c"]);
    });

    it("baseURL + basePath", async () => {
      const adapter = Adapter.new({
        baseURL: "https://my-domain.com",
        basePath: "/api/",
      });

      fetchMock.mockImplementation(async (url, options) => {
        if (
          url === "https://my-domain.com/api/list"
          && options?.method === "GET"
        ) {
          return Response.json(["a", "b", "c"]);
        }
        throw new Error("unexpected request");
      });

      const e = await adapter.get("/list");

      expect(e.data).toEqual(["a", "b", "c"]);
    });
  });
});
