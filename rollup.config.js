import babel from 'rollup-plugin-babel';
import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import builtins from 'rollup-plugin-node-builtins';

export default [{
    input: 'src/index.js',
    output: {
        file: 'index.js',
        format: 'umd',
        name: 'FormSerialize'
    },
    plugins: [
        babel(),
        builtins(),
        resolve(),
        commonjs()
    ]
}, {
    input: 'test/index.js',
    output: {
        file: 'test/index-polyglot.js',
        format: 'umd',
        name: 'FormSerializeTest'
    },
    plugins: [
        babel(),
        builtins(),
        resolve(),
        commonjs()
    ]
}];
