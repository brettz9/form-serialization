/* eslint-env node */
'use strict';

module.exports = {
  plugins: ['plugins/markdown'],
  recurseDepth: 10,
  source: {
    exclude: [
      'node_modules',
      'dist',
      'test'
    ],
    excludePattern: 'rollup*|test'
  },
  sourceType: 'module',
  tags: {
    allowUnknownTags: false
  },
  templates: {
    cleverLinks: true,
    monospaceLinks: false /* ,
    default: {
      layoutFile: 'docs/layout.tmpl'
    } */
  },
  opts: {
    recurse: true,
    verbose: true,
    destination: 'docs/jsdoc'
    // tutorials: 'docs/tutorials'
  }
};
