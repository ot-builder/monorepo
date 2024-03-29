/* eslint-env node */

module.exports = {
    root: true,
    parser: "@typescript-eslint/parser",
    plugins: ["@typescript-eslint", "import", "monorepo-cop", "prettier"],
    ignorePatterns: ["node_modules", "packages/*/lib", "coverage", "generated*.ts"],
    extends: [
        "eslint:recommended",
        "plugin:@typescript-eslint/eslint-recommended",
        "plugin:@typescript-eslint/recommended",
        "plugin:import/errors",
        "plugin:import/warnings",
        "plugin:import/typescript",
        "plugin:monorepo-cop/recommended",
        "prettier"
    ],
    rules: {
        "linebreak-style": ["error", "unix"],
        complexity: ["warn", 16],
        "no-restricted-imports": [
            "error",
            { paths: ["@ot-builder"], patterns: ["@ot-builder/*/src", "@ot-builder/*/lib"] }
        ],
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
        "no-inner-declarations": "off",
        "@typescript-eslint/no-empty-function": "off",
        "@typescript-eslint/no-empty-interface": "off",
        "@typescript-eslint/no-non-null-assertion": "off",
        "prefer-const": ["error", { destructuring: "all", ignoreReadBeforeAssign: false }],
        "@typescript-eslint/explicit-module-boundary-types": "off",
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
        "prettier/prettier": "error"
    }
};
