module.exports = {
    'env': {
        'browser': true,
        'es2021': true,
        //'jquery': true
    },
    //exclude built files, third party libraries and config files
    'ignorePatterns': ['dist/**', 'Scripts/UTIF.js', 'webpack.config.js'],
    'plugins': ['compat'],
    'extends': ['plugin:compat/recommended', 'eslint:recommended'],
    'overrides': [
        {
            'env': {
                'node': true
            },
            'files': [
                '.eslintrc.{js,cjs}'
            ],
            'parserOptions': {
                'sourceType': 'script'
            }
        }
    ],
    'parserOptions': {
        'ecmaVersion': 'latest',
        'sourceType': 'module'
    },
    'rules': {
        'indent': [
            'error',
            4
        ],
        // 'linebreak-style': [
        //     'error',
        //     'unix'
        // ],
        'quotes': [
            'error',
            'single'
        ],
        'semi': [
            'error',
            'always'
        ]
    }
};
