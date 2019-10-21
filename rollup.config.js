import babel from 'rollup-plugin-babel';

/**
 * @external RollupObject
 */

/**
 *
 * @param {"es"|"umd"} format
 * @returns {external:RollupObject[]}
 */
function getConfig ({format}) {
  return [{
    input: 'src/index.js',
    output: {
      file: `dist/index${format === 'es' ? '-es' : ''}.js`,
      format,
      name: 'FormSerialize'
    },
    plugins: [
      babel()
    ]
  }];
}

// eslint-disable-next-line import/no-anonymous-default-export
export default [
  ...getConfig({format: 'umd'}),
  ...getConfig({format: 'es'})
];
