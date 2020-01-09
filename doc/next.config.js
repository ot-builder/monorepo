const withMDX = require("@next/mdx")({ extension: /\.mdx?$/ });
const withStylus = require("@zeit/next-stylus");

const path = require("path");

module.exports = withStylus(
    withMDX({
        distDir: "build",
        pageExtensions: ["tsx", "mdx"],
        webpack(config, options) {
            config.resolve.alias["components"] = path.join(__dirname, "components");
            return config;
        }
    })
);
