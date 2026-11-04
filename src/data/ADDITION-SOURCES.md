# SudachiDict 20261015 notice verification

## Result

The exact-version `sudachidict_core-20261015` source distribution contains `LEGAL` (6,037 bytes) and `LICENSE-2.0.txt`. The original `LEGAL` notice is preserved as [`SUDACHI-NOTICE.txt`](../../public/licenses/SUDACHI-NOTICE.txt).

Its notice says:

- `small_lex.csv` contains part of UniDic and `matrix.def.zip` is part of UniDic. It supplies The UniDic Consortium's 2011–2013 copyright line and the BSD redistribution conditions and disclaimer.
- `core_lex.csv` and `notcore_lex.csv` contain part of NEologd. It gives Toshinori Sato's 2015–2019 copyright line and the upstream attributions/URLs for Hatena keywords, Japan Post postal data, station names, personal-name data, and web-crawled text.
- The SudachiDict distribution is under Apache License 2.0 and reproduces its standard license notice.

This release-specific notice is more precise for these source files than a generic statement that UniDic editions can have different licenses. It does not provide row-level origin mapping, so it does not identify which selected word came from which CSV/component.

## Artifact checks

- PyPI project/release page: <https://pypi.org/project/sudachidict-core/20261015/>. It lists the 20261015 sdist (9.2 kB) and wheel (76.9 MB), both uploaded 2026-10-15.
- Retrieved the sdist from its PyPI file URL, checked its SHA-256 against the PyPI release metadata (`32d2bfc1491b82659959d28f79eb7c034d3a57d77f7610c3d2ea834151d15d23`), and inspected the archive member list and `INFO.json`. It identifies `version`/`dict_version` 20261015, `dictionary_format` v1, edition `core`.
- The sdist member list contains `LEGAL` and `LICENSE-2.0.txt`; it does not contain separate UniDic `AUTHORS`, `BSD`, or NEologd `COPYING` files. `LEGAL` contains the relevant UniDic BSD terms and NEologd attributions itself.
- Did not download the 76.9 MB wheel. An HTTP Range read of its ZIP central directory (without fetching the dictionary payload) listed seven members. The only license-named member was `sudachidict_core-20261015.dist-info/licenses/LICENSE-2.0.txt`; no separate `LEGAL`, UniDic `AUTHORS`/`BSD`, or NEologd `COPYING` member was present. This confirms names, not the content of the wheel's dictionary payload.

## Primary sources

- Exact release tree and `LEGAL`: <https://github.com/WorksApplications/SudachiDict/blob/830bf9e1313f6f75235ba87ee041e144dbcad8c1/LEGAL>
- Exact release tree version metadata (`dict.format=v1`, `dict.version=20261015`): <https://github.com/WorksApplications/SudachiDict/blob/830bf9e1313f6f75235ba87ee041e144dbcad8c1/gradle.properties>
- SudachiDict README: <https://github.com/WorksApplications/SudachiDict/blob/develop/README.md>
- NEologd upstream COPYING: <https://github.com/neologd/mecab-ipadic-neologd/blob/master/COPYING>
- UniDic official site: <https://clrd.ninjal.ac.jp/unidic/>

## Scope note

This is a record of upstream notices and package inspection, not a legal opinion about whether a particular curated list of words is copyrightable or whether every upstream source condition applies to each word. The release notice itself does not map entries to their original sources.
