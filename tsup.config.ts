import { polyfillNode } from "esbuild-plugin-polyfill-node"
import { rename } from "node:fs/promises"
import { join } from "node:path"
import { defineConfig, Options } from "tsup"

const BASE_OPTIONS: Options = {
    clean: true,
    dts: true,
    outExtension: ({ format }) =>
        format === "iife"
            ? {}
            : {
                js: `.${format === "cjs" ? "cjs" : "mjs"}`,
            },
    sourcemap: true,
    splitting: false,
    treeshake: true,
}

const BROWSER_OPTIONS: Options = {
    esbuildPlugins: [
        polyfillNode({
            globals: {
                buffer: true,
            },
            polyfills: {
                buffer: true,
            },
        }),
    ],
}

export default defineConfig([
    {
        ...BASE_OPTIONS,
        ...BROWSER_OPTIONS,
        entry: ["src/index.browser.ts"],
        format: ["cjs", "esm"],
        name: "Browser",
    },
    {
        ...BASE_OPTIONS,
        ...BROWSER_OPTIONS,
        dts: false,
        entry: ["src/index.browser-bundle.ts"],
        format: "iife",
        globalName: "RPCWebSocket",
        name: "Browser Bundle",
        minify: true,
        outExtension: () => ({
            js: ".js",
        }),
        sourcemap: false,
        target: "es2017",
    },
    {
        ...BASE_OPTIONS,
        entry: ["src/index.ts"],
        format: ["cjs", "esm"],
        name: "Node",
    },
])
