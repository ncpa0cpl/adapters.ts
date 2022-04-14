import { DataType } from "dilswer";
import { FetchAdapter } from "../../src";

jest.mock("axios", () => jest.requireActual("../../__mocks__/axios-mock.ts"));

const fetchMock = jest.fn();
global.fetch = fetchMock;

describe("FetchAdapter", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should correctly send basic requests", async () => {
    class TestAdapter extends FetchAdapter {
      static readonly URL_TEMPLATE = "my.api";
    }

    await TestAdapter.delete();
    expect(fetchMock).toHaveBeenLastCalledWith("my.api", {
      method: "DELETE",
    });

    await TestAdapter.get();
    expect(fetchMock).toHaveBeenLastCalledWith("my.api", {
      method: "GET",
    });

    await TestAdapter.options();
    expect(fetchMock).toHaveBeenLastCalledWith("my.api", {
      method: "OPTIONS",
    });

    await TestAdapter.patch();
    expect(fetchMock).toHaveBeenLastCalledWith("my.api", {
      method: "PATCH",
    });

    await TestAdapter.post();
    expect(fetchMock).toHaveBeenLastCalledWith("my.api", {
      method: "POST",
    });

    await TestAdapter.put();
    expect(fetchMock).toHaveBeenLastCalledWith("my.api", {
      method: "PUT",
    });
  });

  it("should correctly send requests with data", async () => {
    class TestAdapter extends FetchAdapter {
      static readonly URL_TEMPLATE = "my.api";

      static readonly DELETE_REQUEST_TYPE_DEF = DataType.ArrayOf(
        DataType.String
      );
      static readonly GET_REQUEST_TYPE_DEF = DataType.RecordOf({
        bar: { type: DataType.String },
      });
      static readonly OPTIONS_REQUEST_TYPE_DEF = DataType.ArrayOf(
        DataType.String
      );
      static readonly PATCH_REQUEST_TYPE_DEF = DataType.ArrayOf(
        DataType.String
      );
      static readonly POST_REQUEST_TYPE_DEF = DataType.ArrayOf(DataType.String);
      static readonly PUT_REQUEST_TYPE_DEF = DataType.ArrayOf(DataType.String);
    }

    await TestAdapter.delete({ data: ["foo"] });
    expect(fetchMock).toHaveBeenLastCalledWith("my.api", {
      method: "DELETE",
      body: '["foo"]',
    });

    await TestAdapter.get({ data: { bar: "yes" } });
    expect(fetchMock).toHaveBeenLastCalledWith("my.api?bar=yes", {
      method: "GET",
    });

    await TestAdapter.options({ data: ["baz"] });
    expect(fetchMock).toHaveBeenLastCalledWith("my.api", {
      method: "OPTIONS",
      body: '["baz"]',
    });

    await TestAdapter.patch({ data: ["qux"] });
    expect(fetchMock).toHaveBeenLastCalledWith("my.api", {
      method: "PATCH",
      body: '["qux"]',
    });

    await TestAdapter.post({ data: ["quux"] });
    expect(fetchMock).toHaveBeenLastCalledWith("my.api", {
      method: "POST",
      body: '["quux"]',
    });

    await TestAdapter.put({ data: ["coorg"] });
    expect(fetchMock).toHaveBeenLastCalledWith("my.api", {
      method: "PUT",
      body: '["coorg"]',
    });
  });

  it("should correctly send requests with config", async () => {
    class TestAdapter extends FetchAdapter {
      static readonly URL_TEMPLATE = "my.api";
    }
    await TestAdapter.delete({ config: { mode: "same-origin" } });
    expect(fetchMock).toHaveBeenLastCalledWith("my.api", {
      method: "DELETE",
      mode: "same-origin",
    });
    await TestAdapter.get({ config: { mode: "same-origin" } });
    expect(fetchMock).toHaveBeenLastCalledWith("my.api", {
      method: "GET",
      mode: "same-origin",
    });
    await TestAdapter.options({ config: { mode: "same-origin" } });
    expect(fetchMock).toHaveBeenLastCalledWith("my.api", {
      method: "OPTIONS",
      mode: "same-origin",
    });
    await TestAdapter.patch({ config: { mode: "same-origin" } });
    expect(fetchMock).toHaveBeenLastCalledWith("my.api", {
      method: "PATCH",
      mode: "same-origin",
    });
    await TestAdapter.post({ config: { mode: "same-origin" } });
    expect(fetchMock).toHaveBeenLastCalledWith("my.api", {
      method: "POST",
      mode: "same-origin",
    });
    await TestAdapter.put({ config: { mode: "same-origin" } });
    expect(fetchMock).toHaveBeenLastCalledWith("my.api", {
      method: "PUT",
      mode: "same-origin",
    });
  });

  it("should correctly send requests with parametrized url", async () => {
    class TestAdapter extends FetchAdapter {
      static readonly URL_TEMPLATE = "my.api/endpoint/{id}/{?opt}";
    }

    await TestAdapter.delete({ id: 1, opt: "foo" });
    expect(fetchMock).toHaveBeenLastCalledWith("my.api/endpoint/1/foo", {
      method: "DELETE",
    });

    await TestAdapter.get({ id: 2, opt: "bar" });
    expect(fetchMock).toHaveBeenLastCalledWith("my.api/endpoint/2/bar", {
      method: "GET",
    });

    await TestAdapter.options({ id: 3, opt: "baz" });
    expect(fetchMock).toHaveBeenLastCalledWith("my.api/endpoint/3/baz", {
      method: "OPTIONS",
    });

    await TestAdapter.patch({ id: 4, opt: "qux" });
    expect(fetchMock).toHaveBeenLastCalledWith("my.api/endpoint/4/qux", {
      method: "PATCH",
    });

    await TestAdapter.post({ id: 5, opt: "quux" });
    expect(fetchMock).toHaveBeenLastCalledWith("my.api/endpoint/5/quux", {
      method: "POST",
    });

    await TestAdapter.put({ id: 6, opt: "coorg" });
    expect(fetchMock).toHaveBeenLastCalledWith("my.api/endpoint/6/coorg", {
      method: "PUT",
    });
  });

  it("should correctly send requests with parametrized url and data", async () => {
    class TestAdapter extends FetchAdapter {
      static readonly URL_TEMPLATE = "my.api/endpoint/{id}/{?opt}";

      static readonly DELETE_REQUEST_TYPE_DEF = DataType.ArrayOf(
        DataType.String
      );
      static readonly GET_REQUEST_TYPE_DEF = DataType.RecordOf({
        bar: { type: DataType.String },
      });
      static readonly OPTIONS_REQUEST_TYPE_DEF = DataType.Boolean;
      static readonly PATCH_REQUEST_TYPE_DEF = DataType.ArrayOf(
        DataType.Number
      );
      static readonly POST_REQUEST_TYPE_DEF = DataType.RecordOf({
        quux: { type: DataType.Literal("quux") },
      });
      static readonly PUT_REQUEST_TYPE_DEF = DataType.Literal(1);
    }

    await TestAdapter.delete({ id: 10 }, { data: ["foo"] });
    expect(fetchMock).toHaveBeenLastCalledWith("my.api/endpoint/10", {
      method: "DELETE",
      body: '["foo"]',
    });

    await TestAdapter.get({ id: 11 }, { data: { bar: "bar" } });
    expect(fetchMock).toHaveBeenLastCalledWith("my.api/endpoint/11?bar=bar", {
      method: "GET",
    });

    await TestAdapter.options({ id: 12 }, { data: true });
    expect(fetchMock).toHaveBeenLastCalledWith("my.api/endpoint/12", {
      method: "OPTIONS",
      body: "true",
    });

    await TestAdapter.patch({ id: 13 }, { data: [3, 6, 8] });
    expect(fetchMock).toHaveBeenLastCalledWith("my.api/endpoint/13", {
      method: "PATCH",
      body: "[3,6,8]",
    });

    await TestAdapter.post({ id: 14 }, { data: { quux: "quux" } });
    expect(fetchMock).toHaveBeenLastCalledWith("my.api/endpoint/14", {
      method: "POST",
      body: '{"quux":"quux"}',
    });

    await TestAdapter.put({ id: 15 }, { data: 1 });
    expect(fetchMock).toHaveBeenLastCalledWith("my.api/endpoint/15", {
      method: "PUT",
      body: "1",
    });
  });

  it("should validate the response and return it", async () => {
    class TestAdapter extends FetchAdapter {
      static readonly URL_TEMPLATE = "/api";

      static readonly DELETE_RESPONSE_TYPE_DEF = DataType.RecordOf({
        foo: { type: DataType.String },
      });
      static readonly GET_RESPONSE_TYPE_DEF = DataType.RecordOf({
        bar: { type: DataType.String },
      });
      static readonly OPTIONS_RESPONSE_TYPE_DEF = DataType.RecordOf({
        baz: { type: DataType.String },
      });
      static readonly PATCH_RESPONSE_TYPE_DEF = DataType.RecordOf({
        qux: { type: DataType.String },
      });
      static readonly POST_RESPONSE_TYPE_DEF = DataType.RecordOf({
        quux: { type: DataType.String },
      });
      static readonly PUT_RESPONSE_TYPE_DEF = DataType.RecordOf({
        coorg: { type: DataType.String },
      });
    }

    const responseData = { foo: "foo" };
    const mockResult1 = {
      ok: true,
      json() {
        return responseData;
      },
    };
    fetchMock.mockResolvedValue(mockResult1);
    const result1 = await TestAdapter.delete();
    expect(result1.json()).toEqual(responseData);

    // const mockResult2 = { data: { bar: "bar" }, status: 200 };
    // fetchMock.mockResolvedValue(mockResult2);
    // const result2 = await TestAdapter.get();
    // expect(result2).toEqual(mockResult2);

    // const mockResult3 = { data: { baz: "baz" }, status: 200 };
    // fetchMock.mockResolvedValue(mockResult3);
    // const result3 = await TestAdapter.options();
    // expect(result3).toEqual(mockResult3);

    // const mockResult4 = { data: { qux: "qux" }, status: 200 };
    // fetchMock.mockResolvedValue(mockResult4);
    // const result4 = await TestAdapter.patch();
    // expect(result4).toEqual(mockResult4);

    // const mockResult5 = { data: { quux: "quux" }, status: 200 };
    // fetchMock.mockResolvedValue(mockResult5);
    // const result5 = await TestAdapter.post();
    // expect(result5).toEqual(mockResult5);

    // const mockResult6 = { data: { coorg: "coorg" }, status: 200 };
    // fetchMock.mockResolvedValue(mockResult6);
    // const result6 = await TestAdapter.put();
    // expect(result6).toEqual(mockResult6);
  });

  // it("should validate the response and throw error if invalid", async () => {
  //   class TestAdapter extends FetchAdapter {
  //     static readonly URL_TEMPLATE = "/api";

  //     static readonly DELETE_RESPONSE_TYPE_DEF = DataType.RecordOf({
  //       foo: { type: DataType.String },
  //     });
  //     static readonly GET_RESPONSE_TYPE_DEF = DataType.RecordOf({
  //       bar: { type: DataType.String },
  //     });
  //     static readonly OPTIONS_RESPONSE_TYPE_DEF = DataType.RecordOf({
  //       baz: { type: DataType.String },
  //     });
  //     static readonly PATCH_RESPONSE_TYPE_DEF = DataType.RecordOf({
  //       qux: { type: DataType.String },
  //     });
  //     static readonly POST_RESPONSE_TYPE_DEF = DataType.RecordOf({
  //       quux: { type: DataType.String },
  //     });
  //     static readonly PUT_RESPONSE_TYPE_DEF = DataType.RecordOf({
  //       coorg: { type: DataType.String },
  //     });
  //   }

  //   const mockResult1 = { data: { foo: 1 }, status: 200 };
  //   fetchMock.mockResolvedValue(mockResult1);
  //   expect(TestAdapter.delete()).rejects.toThrowError();

  //   const mockResult2 = { data: {}, status: 200 };
  //   fetchMock.mockResolvedValue(mockResult2);
  //   expect(TestAdapter.get()).rejects.toThrowError();

  //   const mockResult3 = { data: true, status: 200 };
  //   fetchMock.mockResolvedValue(mockResult3);
  //   expect(TestAdapter.options()).rejects.toThrowError();

  //   const mockResult4 = { data: { quux: "quux" }, status: 200 };
  //   fetchMock.mockResolvedValue(mockResult4);
  //   expect(TestAdapter.patch()).rejects.toThrowError();

  //   const mockResult5 = { data: ["quux", "quux"], status: 200 };
  //   fetchMock.mockResolvedValue(mockResult5);
  //   expect(TestAdapter.post()).rejects.toThrowError();

  //   const mockResult6 = { data: [["coorg", "coorg"]], status: 200 };
  //   fetchMock.mockResolvedValue(mockResult6);
  //   expect(TestAdapter.put()).rejects.toThrowError();
  // });
});
