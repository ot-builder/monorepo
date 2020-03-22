# Change Log - @ot-builder/io-bin-layout

This log was last generated on Sun, 22 Mar 2020 00:11:55 GMT and should not be manually modified.

## 0.5.0
Sun, 22 Mar 2020 00:11:55 GMT

### Minor changes

- Change case datatypes to case classes (belleve@typeof.net)
### Patches

- Add import path check (belleve@typeof.net)
## 0.4.0
Mon, 16 Mar 2020 12:13:10 GMT

### Minor changes

- Make the font merger able to support feature variations by dicing the variation space. (belleve@typeof.net)
- Remove the {ref:} indirect references from the data types. (belleve@typeof.net)
## 0.3.4
Sun, 15 Mar 2020 00:17:52 GMT

### Patches

- Add support for feature params of `cv##` features. (belleve@typeof.net)
- Add tests for feature variations (belleve@typeof.net)
## 0.3.3
Sun, 16 Feb 2020 00:16:01 GMT

### Patches

- Enforce import ordering (belleve@typeof.net)
## 0.3.0
Fri, 17 Jan 2020 05:07:07 GMT

### Minor changes

- Add documentation; Refactor some API exports (belleve@typeof.net)
- Hide classes in ft-layout (belleve@typeof.net)
- Split Ot.GsubGpos.Lookup (belleve@typeof.net)
- Split Ot.Var.Dim from Ot.Fvar.Axis (belleve@typeof.net)
- Optimize API for ValueFactory (belleve@typeof.net)
- Refactor "Caster" to "Sigma" and remove Geometry dynamic casting -- use algebra to do the conversion (belleve@typeof.net)
- Layout: Remove tagless final representation. It is over-design. (belleve@typeof.net)
### Patches

- Optimize Ot.DicingStore for GPOS pairing lookup read performance (belleve@typeof.net)
- Add production build (belleve@typeof.net)
- Fix all CRLF (belleve@typeof.net)
- Move tslint -> eslint (belleve@typeof.net)