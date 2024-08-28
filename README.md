# adapters.ts

Quick, easy and type-safe way for declarative http endpoint definitions.

## Quick Start

### Simple, untyped requests.

```typescript
import { adapter } from "adapters.ts";

// get request
adapter.get("/api/films", {
  baseURL: "https://swapi.dev/",
}).then(response => {
  console.log(response.data);
});

// post request
adapter.post("/api/films", {
  body: {
    title: "A New Hope",
  },
  baseURL: "https://swapi.dev/",
});
```

### Request with types and validation

```typescript
import { adapter } from "adapters.ts";

adapter.get("/api/films", {
  baseURL: "https://swapi.dev/",
  validate: (data): data is { title: string }[] => {
    return Array.isArray(data)
      && data.every(film => typeof film.title === "string");
  },
}).then(response => {
  console.log(response.data);
});
```

### Endpoint defintions

Endpoint definitions can enforce specific response data types and request data types, as well as possible or required search and query parameters.

```typescript
import { Adapter } from "adapters.ts";

const swapi = Adapter.new({ baseURL: "https://swapi.dev/" });

const film = swapi.endpoint({
  // path to endpoint with a required "id" query parameter
  url: "/api/film/{id}",
  // define an optional "fields" search parameter
  searchParams: ["?fields"],
  validate: {
    // shape of GET response
    get: (data): data is { id: string; title: string } => {
      return typeof data === "object" && typeof data.title === "string"
        && typeof data.id === "string";
    },
    // shape of PATCH response
    patch: (data): data is { ok: boolean } => {
      return typeof data === "object" && typeof data.ok === "boolean";
    },
  },
  validateRequest: {
    // shape of POST request
    patch: (data): data is { title: string } => {
      return typeof data === "object" && typeof data.title === "string";
    },
  },
});

// sends a GET request to https://swapi.dev/api/film/1?fields=id,title
film.get({ id: 1 }, { searchParams: { fields: "id,title" } }).then(response => {
  response.data; // { id: string, title: string }
});

// sends a PATCH request to https://swapi.dev/api/film/1
film.patch({ id: 1 }, { title: "A New Hope" }).then(response => {
  response.data; // { ok: boolean }
});
```

**Note:** The `validate` and `validateRequest` functions don't actually have to perform any runtime validation.
A basic method returning `true` with appropraite type definition can be used insted to only provide type definitions.
(e.x. `(data): data is MyObject => true`)

## Url templating

[See here how to create more advanced URL templates](https://github.com/ncpa0cpl/url-templater?tab=readme-ov-file#url-templaterts)

## Fetch

By default `fetch` is being used to make requests, but other methods can be used instead by providing an interface to the `Adapter.new` method.

Required interface can be foud here: [XHRInterface](./src/xhr-interface.ts)
