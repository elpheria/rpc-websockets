import { defineConfig, globalIgnores } from "eslint/config";
import typescriptEslint from "@typescript-eslint/eslint-plugin";
import globals from "globals";
import tsParser from "@typescript-eslint/parser";
import path from "node:path";
import { fileURLToPath } from "node:url";
import js from "@eslint/js";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
    baseDirectory: __dirname,
    recommendedConfig: js.configs.recommended,
    allConfig: js.configs.all
});

export default defineConfig([globalIgnores(["**/dist/"]), {
    extends: compat.extends("eslint:recommended", "plugin:@typescript-eslint/eslint-recommended"),

    plugins: {
        "@typescript-eslint": typescriptEslint,
    },

    languageOptions: {
        globals: {
            ...globals.node,
            ...globals.browser,
            ...globals.mocha,
        },

        parser: tsParser,
        ecmaVersion: 5,
        sourceType: "module",
    },

    rules: {
        "brace-style": ["error", "allman", {
            allowSingleLine: true,
        }],

        indent: ["error", 4],
        "linebreak-style": ["error", "unix"],
        quotes: ["error", "double"],
        semi: ["error", "never"],
        "comma-spacing": ["error"],
        "comma-style": ["error"],
        "func-call-spacing": ["error"],
        "key-spacing": ["error"],
        "keyword-spacing": ["error"],

        "lines-around-comment": ["error", {
            beforeBlockComment: false,
            afterBlockComment: false,
        }],

        "lines-around-directive": ["error"],
        "max-len": ["error", 100],
        "new-cap": ["error"],
        "no-console": 0,

        "no-multiple-empty-lines": ["error", {
            max: 1,
        }],

        "no-tabs": ["error"],
        "no-trailing-spaces": ["error"],
        "no-whitespace-before-property": ["error"],
        "operator-linebreak": ["error"],

        "semi-spacing": ["error", {
            before: false,
            after: true,
        }],

        "space-before-blocks": ["error"],
        "space-in-parens": ["error"],
        "space-infix-ops": ["error"],
        "space-unary-ops": ["error"],
        "spaced-comment": ["error"],
        "arrow-parens": ["error"],
        "arrow-spacing": ["error"],
        "no-duplicate-imports": ["error"],
        "prefer-const": ["error"],
        "no-cond-assign": 0,
        "no-unused-vars": "off",
        "@typescript-eslint/no-unused-vars": "error",
    },
}]);