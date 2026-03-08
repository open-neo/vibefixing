import { defineConfig } from "tsup";

export default defineConfig([
  {
    entry: { "bin/vibefixing": "src/bin/vibefixing.ts" },
    format: ["esm"],
    target: "node18",
    clean: true,
    sourcemap: true,
    splitting: false,
    banner: {
      js: "#!/usr/bin/env node",
    },
  },
  {
    entry: { index: "src/index.ts" },
    format: ["esm"],
    target: "node18",
    dts: true,
    sourcemap: true,
    splitting: false,
  },
]);
