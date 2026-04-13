import path from "path";
import mdx from "@next/mdx";
import url from "url";

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));

const withMDX = mdx({ extension: /\.mdx?$/ });

export default withMDX({
    distDir: ".build",
    output: "export",
    pageExtensions: ["tsx", "mdx"],
    sassOptions: { loadPaths: [path.join(__dirname, "styles")] },
    turbopack: {
        root: path.join(__dirname, "..")
    }
});
