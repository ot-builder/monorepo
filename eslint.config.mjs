import globals from "globals";
import eslint from "@eslint/js";
import eslintPluginPrettierRecommended from "eslint-plugin-prettier/recommended";
import importPlugin from "eslint-plugin-import";
import tseslint from "typescript-eslint";
import unusedImports from "eslint-plugin-unused-imports";

export default tseslint.config(
    eslint.configs.recommended,
    tseslint.configs.recommended,
    eslintPluginPrettierRecommended,
    importPlugin.flatConfigs.recommended,

    {
        ignores: ["node_modules", "packages/*/lib", "**/generated.ts", "doc/.next"]
    },

    {
        files: [
            "scripts/**/*.mjs",
            "beachball.config.mjs",
            "eslint.config.mjs",
            "jest.config.js",
            "doc/next.config.js"
        ],

        languageOptions: {
            globals: {
                ...globals.node,
                ...globals.nodeBuiltin,
                ...globals.es2021
            }
        },

        rules: { "import/no-unresolved": "off", "@typescript-eslint/no-unused-vars": "off" }
    },

    {
        files: ["packages/*/src/**/*.ts", "doc/**/*.ts", "doc/**/*.tsx"],
        plugins: {
            "unused-imports": unusedImports
        },
        rules: {
            // eslint rules
            "linebreak-style": ["error", "unix"],
            complexity: ["warn", 16],
            "no-restricted-imports": [
                "error",
                { paths: ["@ot-builder"], patterns: ["@ot-builder/*/src", "@ot-builder/*/lib"] }
            ],
            "prefer-const": ["error", { destructuring: "all", ignoreReadBeforeAssign: false }],
            "no-inner-declarations": "off",

            // typescript rules
            "@typescript-eslint/no-use-before-define": "off",
            "@typescript-eslint/explicit-function-return-type": "off",
            "@typescript-eslint/explicit-member-accessibility": [
                "error",
                {
                    accessibility: "explicit",
                    overrides: {
                        accessors: "explicit",
                        constructors: "no-public",
                        methods: "explicit",
                        properties: "explicit",
                        parameterProperties: "explicit"
                    }
                }
            ],
            "@typescript-eslint/no-inferrable-types": "off",
            "@typescript-eslint/no-unused-vars": "off",
            "@typescript-eslint/no-namespace": "off",
            "@typescript-eslint/no-inner-declarations": "off",
            "@typescript-eslint/no-empty-function": "off",
            "@typescript-eslint/no-empty-interface": "off",
            "@typescript-eslint/no-non-null-assertion": "off",
            "@typescript-eslint/explicit-module-boundary-types": "off",

            // prettier rules
            "prettier/prettier": "error",

            // import rules
            "import/no-unresolved": "off",
            "import/order": [
                "error",
                {
                    groups: ["builtin", "external", "internal", "parent", "sibling", "index"],
                    "newlines-between": "always",
                    alphabetize: { order: "asc", caseInsensitive: true }
                }
            ],
            "import/export": "off", // we have TS
            "import/namespace": "off", // we have TS
            "import/no-extraneous-dependencies": "error",
            "import/newline-after-import": ["error", { count: 1 }],
            "unused-imports/no-unused-imports": "error"
        }
    }
);
