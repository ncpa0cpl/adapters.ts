# adapters.ts

Quick, easy and type-safe way for declarative http endpoint definitions.

## Quick Start

By default `adapters.ts` provides two ready to use adapter classes:

- **FetchAdapter** that leverages the native browser fetch API
- **AxiosAdapter** that leverages the Axios library (axios needs to be installed separately)

but any http client library can be used with `adapters.ts`.

### Define a simple axios adapter

```ts
import { AxiosAdapter } from "adapters.ts";

class SwapiStarship extends AxiosAdapter {
  // must be a readonly
  static readonly URL_TEMPLATE = "https://swapi.dev/api/starships/{id}";
}

// SwapiStarship: {
//  get(urlParams: { id: string }, options?: { config?: AxiosRequestConfig }): Promise<AxiosResponse>;
//  post(urlParams: { id: string }, options?: { config?: AxiosRequestConfig }): Promise<AxiosResponse>;
//  put(urlParams: { id: string }, options?: { config?: AxiosRequestConfig }): Promise<AxiosResponse>;
//  patch(urlParams: { id: string }, options?: { config?: AxiosRequestConfig }): Promise<AxiosResponse>;
//  delete(urlParams: { id: string }, options?: { config?: AxiosRequestConfig }): Promise<AxiosResponse>;
//  options(urlParams: { id: string }, options?: { config?: AxiosRequestConfig }): Promise<AxiosResponse>;
// }

// send a get request
SwapiStarship.get({ id: "1" }).then(
  (response /* AxiosResponse<any, any> */) => {
    console.log(response.data);
  }
);
```

### Adapter with type guards on received data

```ts
import { AxiosAdapter, DataType } from "adapters.ts";

class SwapiStarship extends AxiosAdapter {
  static readonly URL_TEMPLATE = "https://swapi.dev/api/starships/{id}";

  static GET_RESPONSE_TYPE_DEF = DataType.RecordOf({
    name: DataType.String,
    model: DataType.String,
    /* ... */
  });
}

// SwapiStarship: {
//  get(
//    urlParams: { id: string },
//    options?: { config?: AxiosRequestConfig }
//  ): Promise<AxiosResponse<{name: string; model: string; }>>;
//
//  post(urlParams: { id: string }, options?: { config?: AxiosRequestConfig }): Promise<AxiosResponse>;
//  ...
// }

// send a request
SwapiStarship.get({ id: "1" }).then(
  (response /* AxiosResponse<{name: string, model: string, ...}, any> */) => {
    console.log(response.data);
  }
);
```

### Adapter with type guards on sent data

```ts
import { AxiosAdapter, DataType } from "adapters.ts";

class SwapiStarship extends AxiosAdapter {
  static readonly URL_TEMPLATE = "https://swapi.dev/api/starships";

  static POST_REQUEST_TYPE_DEF = DataType.RecordOf({
    name: DataType.String,
    model: DataType.String,
    /* ... */
  });
}

// SwapiStarship: {
//  get(options?: { config?: AxiosRequestConfig }): Promise<AxiosResponse>;
//
//  post(
//    options: {
//      data: {
//        name: string;
//        model: string;
//      };
//      config?: AxiosRequestConfig;
//    }
//  ): Promise<AxiosResponse>;
//  ...
// }

// send a request
SwapiStarship.post({
  // Provided data must have a type that matches the definition in the above class
  data: {
    name: "CR90 Corvette",
    model: "CR90 Corvette",
  },
});
```

### Disable/enable data validation on requests and responses

```ts
import { AxiosAdapter } from "adapters.ts";

class MyAdapter extends AxiosAdapter {
  static readonly URL_TEMPLATE = "https://url-goes.here";

  // set this to true to validate all incoming requests against
  // the below type definitions, or to false to not validate at all
  // default is `false`
  static VALIDATE_REQUESTS = true;

  static DELETE_REQUEST_TYPE_DEF = /* some type definition */;
  static GET_REQUEST_TYPE_DEF = /* some type definition */;
  static OPTIONS_REQUEST_TYPE_DEF = /* some type definition */;
  static PATCH_REQUEST_TYPE_DEF = /* some type definition */;
  static POST_REQUEST_TYPE_DEF = /* some type definition */;
  static PUT_REQUEST_TYPE_DEF = /* some type definition */;

  // set this to true to validate all incoming requests against
  // the below type definitions, or to false to not validate at all
  // default is `true`
  static VALIDATE_RESPONSES = true;

  static DELETE_RESPONSE_TYPE_DEF = /* some type definition */;
  static GET_RESPONSE_TYPE_DEF = /* some type definition */;
  static OPTIONS_RESPONSE_TYPE_DEF = /* some type definition */;
  static PATCH_RESPONSE_TYPE_DEF = /* some type definition */;
  static POST_RESPONSE_TYPE_DEF = /* some type definition */;
  static PUT_RESPONSE_TYPE_DEF = /* some type definition */;
}
```

### Specify an axios instance for the adapter

To use a specific axios instance:

```ts
import { AxiosAdapter, AxiosXHR } from "adapters.ts";

const myAxiosInstance = axios.create();

class SwapiStarship extends AxiosAdapter {
  protected static readonly xhr = new AxiosXHR(myAxiosInstance);

  static URL_TEMPLATE = "https://swapi.dev/api/starships/{id}";
}
```

### Define new adapter with a http client of your choice

First a class implementing an adapters.ts XHRInterface will be necessary. This class will be used to send actual request and retrieve the payload for validation.

(for reference [here is the default axios xhr interface](./src/AxiosAdapter/axios-xhr.ts))

```ts
import type { XHRInterface, _, RequestMethod } from "adapters.ts";

type MyHTTPClientResponse<T> = {
  data: T; // response payload
  status: number; // ex. 404, 200 etc
};

type MyHTTPClientConfig = {
  /* ... */
};

const MyHTTPClientInstance = new MyHTTPClient(); // a hypothetical http client

class MyHTTPClientXHR<T = _> implements XHRInterface<MyHTTPClientResponse<T>> {
  async sendRequest(params: {
    method: RequestMethod;
    url: string;
    data?: Record<string, any>;
    config?: MyHTTPClientConfig;
  }): Promise<MyHTTPClientResponse<T>> {
    return MyHTTPClientInstance.sendHttpRequest<T>(/* ... */);
  }

  async extractPayload(response: MyHTTPClientResponse<T>): Promise<T> {
    return response.data;
  }
}
```

Provide the XHRInterface class instance to the Adapter:

```ts
import { BaseAdapter } from "adapters.ts";

class MyHTTPClientAdapter extends BaseAdapter {
  protected static readonly xhr = new MyHTTPClientXHR();
}
```

The `MyHTTPClientAdapter` can be then used in the same way as `AxiosAdapter` or `FetchAdapter`.
