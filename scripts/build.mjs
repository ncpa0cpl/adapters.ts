import { build } from "@ncpa0cpl/nodepack";
import path from "node:path";

const ROOT_DIR = new URL("../", import.meta.url).pathname;
const p = (...s) => path.join(ROOT_DIR, ...s);

async function main() {
  await build({
    formats: ["esm"],
    outDir: p("dist"),
    srcDir: p("src"),
    target: "es2022",
    declarations: true,
    tsConfig: p("tsconfig.json"),
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
