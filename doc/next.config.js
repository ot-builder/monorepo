/* eslint-env node */
/* eslint-disable @typescript-eslint/no-var-requires */

const path = require("path");

const withMDX = require("@next/mdx")({ extension: /\.mdx?$/ });

module.exports = withMDX({
    distDir: ".build",
    output: "export",
    pageExtensions: ["tsx", "mdx"],
    eslint: {
        ignoreDuringBuilds: true
    },
    webpack(config, options) {
        config.resolve.alias["components"] = path.join(__dirname, "components");
        config.resolve.alias["api-doc"] = path.join(__dirname, "api-doc");
        config.resolve.alias["templates"] = path.join(__dirname, "templates");
        return config;
    },
    sassOptions: { fiber: false, includePaths: [path.join(__dirname, "styles")] }
});
