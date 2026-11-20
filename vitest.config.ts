import { transform } from "esbuild";
import type { Plugin } from "vite";
import { defineConfig } from "vitest/config";

// oxc (vite 8's TS transformer) passes decorators through untransformed, and
// applies legacy TS semantics when experimentalDecorators is on — these are
// written for stage-3, so esbuild lowers them. Deleting this plugin breaks the
// suite with "SyntaxError: Invalid or unexpected token".
const stage3Decorators: Plugin = {
  name: "esbuild-stage3-decorators",
  enforce: "pre",
  async transform(code, id) {
    const q = id.indexOf("?");
    const filePath = q === -1 ? id : id.slice(0, q);
    if (!/\.[cm]?ts$/.test(filePath) || filePath.includes("node_modules")) {
      return null;
    }
    const result = await transform(code, {
      loader: "ts",
      target: "es2022",
      sourcefile: filePath,
      sourcemap: true,
    });
    return {
      code: result.code,
      map: result.map ? JSON.parse(result.map) : null,
    };
  },
};

export default defineConfig({
  plugins: [stage3Decorators],
});
