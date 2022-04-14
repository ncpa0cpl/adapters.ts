import { DataType } from "dilswer";
import { AxiosAdapter } from "../../src";
import axios from "../../__mocks__/axios-mock";

jest.mock("axios", () => jest.requireActual("../../__mocks__/axios-mock.ts"));

describe("AxiosAdapter", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should correctly send basic axios requests", async () => {
    class TestAdapter extends AxiosAdapter {
      static readonly URL_TEMPLATE = "my.api";
    }

    await TestAdapter.delete();
    expect(axios.request).toHaveBeenLastCalledWith({
      method: "DELETE",
      url: "my.api",
    });

    await TestAdapter.get();
    expect(axios.request).toHaveBeenLastCalledWith({
      method: "GET",
      url: "my.api",
    });

    await TestAdapter.options();
    expect(axios.request).toHaveBeenLastCalledWith({
      method: "OPTIONS",
      url: "my.api",
    });

    await TestAdapter.patch();
    expect(axios.request).toHaveBeenLastCalledWith({
      method: "PATCH",
      url: "my.api",
    });

    await TestAdapter.post();
    expect(axios.request).toHaveBeenLastCalledWith({
      method: "POST",
      url: "my.api",
    });

    await TestAdapter.put();
    expect(axios.request).toHaveBeenLastCalledWith({
      method: "PUT",
      url: "my.api",
    });
  });

  it("should correctly send axios requests with data", async () => {
    class TestAdapter extends AxiosAdapter {
      static readonly URL_TEMPLATE = "my.api";

      static readonly DELETE_REQUEST_TYPE_DEF = DataType.String;
      static readonly GET_REQUEST_TYPE_DEF = DataType.String;
      static readonly OPTIONS_REQUEST_TYPE_DEF = DataType.String;
      static readonly PATCH_REQUEST_TYPE_DEF = DataType.String;
      static readonly POST_REQUEST_TYPE_DEF = DataType.String;
      static readonly PUT_REQUEST_TYPE_DEF = DataType.String;
    }

    await TestAdapter.delete({ data: "foo" });
    expect(axios.request).toHaveBeenLastCalledWith({
      method: "DELETE",
      url: "my.api",
      data: "foo",
    });

    await TestAdapter.get({ data: "bar" });
    expect(axios.request).toHaveBeenLastCalledWith({
      method: "GET",
      url: "my.api",
      params: "bar",
    });

    await TestAdapter.options({ data: "baz" });
    expect(axios.request).toHaveBeenLastCalledWith({
      method: "OPTIONS",
      url: "my.api",
      data: "baz",
    });

    await TestAdapter.patch({ data: "qux" });
    expect(axios.request).toHaveBeenLastCalledWith({
      method: "PATCH",
      url: "my.api",
      data: "qux",
    });

    await TestAdapter.post({ data: "quux" });
    expect(axios.request).toHaveBeenLastCalledWith({
      method: "POST",
      url: "my.api",
      data: "quux",
    });

    await TestAdapter.put({ data: "coorg" });
    expect(axios.request).toHaveBeenLastCalledWith({
      method: "PUT",
      url: "my.api",
      data: "coorg",
    });
  });

  it("should correctly send axios requests with config", async () => {
    class TestAdapter extends AxiosAdapter {
      static readonly URL_TEMPLATE = "my.api";
    }

    await TestAdapter.delete({ config: { baseURL: "http://" } });
    expect(axios.request).toHaveBeenLastCalledWith({
      method: "DELETE",
      url: "my.api",
      baseURL: "http://",
    });

    await TestAdapter.get({ config: { baseURL: "http://" } });
    expect(axios.request).toHaveBeenLastCalledWith({
      method: "GET",
      url: "my.api",
      baseURL: "http://",
    });

    await TestAdapter.options({ config: { baseURL: "http://" } });
    expect(axios.request).toHaveBeenLastCalledWith({
      method: "OPTIONS",
      url: "my.api",
      baseURL: "http://",
    });

    await TestAdapter.patch({ config: { baseURL: "http://" } });
    expect(axios.request).toHaveBeenLastCalledWith({
      method: "PATCH",
      url: "my.api",
      baseURL: "http://",
    });

    await TestAdapter.post({ config: { baseURL: "http://" } });
    expect(axios.request).toHaveBeenLastCalledWith({
      method: "POST",
      url: "my.api",
      baseURL: "http://",
    });

    await TestAdapter.put({ config: { baseURL: "http://" } });
    expect(axios.request).toHaveBeenLastCalledWith({
      method: "PUT",
      url: "my.api",
      baseURL: "http://",
    });
  });

  it("should correctly send axios requests with parametrized url", async () => {
    class TestAdapter extends AxiosAdapter {
      static readonly URL_TEMPLATE = "my.api/endpoint/{id}/{?opt}";
    }

    await TestAdapter.delete({ id: 1, opt: "foo" });
    expect(axios.request).toHaveBeenLastCalledWith({
      method: "DELETE",
      url: "my.api/endpoint/1/foo",
    });

    await TestAdapter.get({ id: 2, opt: "bar" });
    expect(axios.request).toHaveBeenLastCalledWith({
      method: "GET",
      url: "my.api/endpoint/2/bar",
    });

    await TestAdapter.options({ id: 3, opt: "baz" });
    expect(axios.request).toHaveBeenLastCalledWith({
      method: "OPTIONS",
      url: "my.api/endpoint/3/baz",
    });

    await TestAdapter.patch({ id: 4, opt: "qux" });
    expect(axios.request).toHaveBeenLastCalledWith({
      method: "PATCH",
      url: "my.api/endpoint/4/qux",
    });

    await TestAdapter.post({ id: 5, opt: "quux" });
    expect(axios.request).toHaveBeenLastCalledWith({
      method: "POST",
      url: "my.api/endpoint/5/quux",
    });

    await TestAdapter.put({ id: 6, opt: "coorg" });
    expect(axios.request).toHaveBeenLastCalledWith({
      method: "PUT",
      url: "my.api/endpoint/6/coorg",
    });
  });

  it("should correctly send axios requests with parametrized url and data", async () => {
    class TestAdapter extends AxiosAdapter {
      static readonly URL_TEMPLATE = "my.api/endpoint/{id}/{?opt}";

      static readonly DELETE_REQUEST_TYPE_DEF = DataType.String;
      static readonly GET_REQUEST_TYPE_DEF = DataType.String;
      static readonly OPTIONS_REQUEST_TYPE_DEF = DataType.String;
      static readonly PATCH_REQUEST_TYPE_DEF = DataType.String;
      static readonly POST_REQUEST_TYPE_DEF = DataType.String;
      static readonly PUT_REQUEST_TYPE_DEF = DataType.String;
    }

    await TestAdapter.delete({ id: 10 }, { data: "foo" });
    expect(axios.request).toHaveBeenLastCalledWith({
      method: "DELETE",
      url: "my.api/endpoint/10",
      data: "foo",
    });

    await TestAdapter.get({ id: 11 }, { data: "bar" });
    expect(axios.request).toHaveBeenLastCalledWith({
      method: "GET",
      url: "my.api/endpoint/11",
      params: "bar",
    });

    await TestAdapter.options({ id: 12 }, { data: "baz" });
    expect(axios.request).toHaveBeenLastCalledWith({
      method: "OPTIONS",
      url: "my.api/endpoint/12",
      data: "baz",
    });

    await TestAdapter.patch({ id: 13 }, { data: "qux" });
    expect(axios.request).toHaveBeenLastCalledWith({
      method: "PATCH",
      url: "my.api/endpoint/13",
      data: "qux",
    });

    await TestAdapter.post({ id: 14 }, { data: "quux" });
    expect(axios.request).toHaveBeenLastCalledWith({
      method: "POST",
      url: "my.api/endpoint/14",
      data: "quux",
    });

    await TestAdapter.put({ id: 15 }, { data: "coorg" });
    expect(axios.request).toHaveBeenLastCalledWith({
      method: "PUT",
      url: "my.api/endpoint/15",
      data: "coorg",
    });
  });

  it("should validate the response and return it", async () => {
    class TestAdapter extends AxiosAdapter {
      static readonly URL_TEMPLATE = "/api";

      static readonly DELETE_RESPONSE_TYPE_DEF = DataType.RecordOf({
        foo: {
          type: DataType.String,
        },
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

    const mockResult1 = { data: { foo: "foo" }, status: 200 };
    axios.request.mockResolvedValue(mockResult1);
    const result1 = await TestAdapter.delete();
    expect(result1.data).toEqual(mockResult1.data);

    const mockResult2 = { data: { bar: "bar" }, status: 200 };
    axios.request.mockResolvedValue(mockResult2);
    const result2 = await TestAdapter.get();
    expect(result2.data).toEqual(mockResult2.data);

    const mockResult3 = { data: { baz: "baz" }, status: 200 };
    axios.request.mockResolvedValue(mockResult3);
    const result3 = await TestAdapter.options();
    expect(result3.data).toEqual(mockResult3.data);

    const mockResult4 = { data: { qux: "qux" }, status: 200 };
    axios.request.mockResolvedValue(mockResult4);
    const result4 = await TestAdapter.patch();
    expect(result4.data).toEqual(mockResult4.data);

    const mockResult5 = { data: { quux: "quux" }, status: 200 };
    axios.request.mockResolvedValue(mockResult5);
    const result5 = await TestAdapter.post();
    expect(result5.data).toEqual(mockResult5.data);

    const mockResult6 = { data: { coorg: "coorg" }, status: 200 };
    axios.request.mockResolvedValue(mockResult6);
    const result6 = await TestAdapter.put();
    expect(result6.data).toEqual(mockResult6.data);
  });

  it("should validate the response and throw error if invalid", async () => {
    class TestAdapter extends AxiosAdapter {
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

    const mockResult1 = { data: { foo: 1 }, status: 200 };
    axios.request.mockResolvedValue(mockResult1);
    expect(TestAdapter.delete()).rejects.toThrowError();

    const mockResult2 = { data: {}, status: 200 };
    axios.request.mockResolvedValue(mockResult2);
    expect(TestAdapter.get()).rejects.toThrowError();

    const mockResult3 = { data: true, status: 200 };
    axios.request.mockResolvedValue(mockResult3);
    expect(TestAdapter.options()).rejects.toThrowError();

    const mockResult4 = { data: { quux: "quux" }, status: 200 };
    axios.request.mockResolvedValue(mockResult4);
    expect(TestAdapter.patch()).rejects.toThrowError();

    const mockResult5 = { data: ["quux", "quux"], status: 200 };
    axios.request.mockResolvedValue(mockResult5);
    expect(TestAdapter.post()).rejects.toThrowError();

    const mockResult6 = { data: [["coorg", "coorg"]], status: 200 };
    axios.request.mockResolvedValue(mockResult6);
    expect(TestAdapter.put()).rejects.toThrowError();
  });
});
