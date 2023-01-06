# `ot-builder` : A Font Library

![GitHub Workflow Status](https://img.shields.io/github/actions/workflow/status/ot-builder/monorepo/prime.yml?logo=github) ![npm](https://img.shields.io/npm/v/ot-builder) ![GitHub issues](https://img.shields.io/github/issues/ot-builder/monorepo) ![GitHub pull requests](https://img.shields.io/github/issues-pr/ot-builder/monorepo) ![License](https://img.shields.io/github/license/ot-builder/monorepo)

`ot-builder` is a TypeScript library that manipulates OpenType fonts.

Currently `ot-builder` supports:

- TrueType and Postscript glyph geometry and hinting;
- OpenType layout (`GSUB`, `GPOS`, etc.);
- First-class variation;
- Font-level glyph mappers and coordinate mappers.

## Building

```bash
npm run boot
npm run build
```

## Testing

```bash
npm test
```

## License

MIT