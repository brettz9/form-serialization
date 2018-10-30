import babel from 'rollup-plugin-babel';

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

export default [
    ...getConfig({format: 'umd'}),
    ...getConfig({format: 'es'}),
    {
        input: 'test/index.js',
        output: {
            file: 'test/index-polyglot.js',
            format: 'umd',
            name: 'FormSerializeTest'
        },
        plugins: [
            babel()
        ]
    }
];
