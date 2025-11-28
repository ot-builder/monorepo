/* eslint-env node */

import path from "path";
import mdx from "@next/mdx";
import url from "url";

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));

const withMDX = mdx({ extension: /\.mdx?$/ });

export default withMDX({
    distDir: ".build",
    output: "export",
    pageExtensions: ["tsx", "mdx"],
    eslint: {
        ignoreDuringBuilds: true
    },
    webpack(config) {
        config.resolve.alias["components"] = path.join(__dirname, "components");
        config.resolve.alias["api-doc"] = path.join(__dirname, "api-doc");
        config.resolve.alias["templates"] = path.join(__dirname, "templates");
        return config;
    },
    sassOptions: { loadPaths: [path.join(__dirname, "styles")] },
    turbopack: {
        root: path.join(__dirname, "..")
    }
});
