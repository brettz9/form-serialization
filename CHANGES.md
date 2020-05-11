# CHANGES for form-serialization

## 0.11.0 (2020-05-11)

- Fix: Throw if control is missing
- Fix: Expect array for inner multiple select
- Docs: Add note re: `FormData`
- Linting (ESLint): As per latest ash-nazg
- Linting (ESLint): Update per new config; apply to any HTML/Markdown JS
- Linting (LGTM): Remove unused variable; add `lgtm.yml`
- Testing: Add nyc for coverage
- Testing: Check bad name and multiple select that is part of array,
    bringing to 100% coverage
- Build: Use "json" extension for RC
- npm: Update `rollup-plugin-babel` to `@rollup/plugin-babel`
    and make explicit `babelHelpers` value of `bundled`
- npm: Update devDeps and add peer dep. no-unsanitized
- npm: Update `opn-cli` -> `open-cli`, devDeps, add peerDep of devDep

## 0.10.0 (2019-04-18)

- Fix: For jsdom, workaround
    <https://github.com/jsdom/jsdom/issues/1570> and use `querySelector`
    if not found by name
- Fix: For jsdom at least, properly set radio checked and multiple selected status
- Throw specific error if control not found of a given name
- Testing: Remove `domify` in favor of just jsdom; workaround
    <https://github.com/jsdom/jsdom/issues/1570>

## 0.9.0 (2019-04-18)

- Enhancement: Bundle jsdoc in npm for sake of npm CDNs (like
    <https://unpkg.com>)

## 0.8.0 (2019-04-18) - New release as "form-serialization"

- Breaking change: Require Node >= 7.0.0
- Breaking change: Move distribution files to `dist` folder
    and update `main`, `module`, and `browser` of `package.json`
- License: Change file name to indicate type (MIT) and add name and
    date to copyright
- Change: Give console warnings if names are not found in hash
- Enhancement: Use ES6 Modules in source and in distribution (along
    with UMD) via Rollup
- Enhancement: Add `deserialize` method and tests
- Enhancement: Add `index-es.js` dist file and point to it in
    `module` on `package.json`
- Refactoring: More ES6
- Linting (package.json): Add `engines` and `homepage`
- Linting (ESLint): Apply eslint-config-ash-nazg; move from deprecated
    rc file without extension
- Testing: Use @babel/register for ESM; change from Zuul to just local
    mocha-qunit
- Docs: Rename History -> CHANGES; add jsdoc; Markdown issue
- npm: Add scripts for build-docs, open-docs, mocha, eslint, rollup
- npm: Update devDeps/deps including forcing security updates
- npm: Rename to publish as separate repo and swap author/contributors
    accordingly
- npm: .npmignore

## 0.7.2 (2017-06-11)

* Serialize properly radio input with empty value (1b7a042)

## 0.7.1 (2016-03-11)

* fix bracket notation number parsing (de5d19)

## 0.7.0 (2015-10-17)

* add bracket notation support for hash serialization

## 0.6.0 (2015-02-23)

* add options.empty to force serialize empty inputs

## 0.5.0 (2015-02-08)

* fix specifying custom serializer

## 0.4.1 (2015-01-15)

* fix nested [][] serialization

## 0.4.0 (2014-12-16)

* consistently serialize [] params into arrays
* fix multi-select field support

## 0.3.0 / 2014-05-01

* support bracket notation for hash serialization

## 0.2.0 / 2013-12-05

* add `disabled` option to include disabled fields

## 0.1.1 / 2013-08-26
