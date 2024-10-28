const js = require('@eslint/js');
const nodePlugin = require("eslint-plugin-n")

module.exports = [
    js.configs.recommended,
    nodePlugin.configs["flat/recommended-script"],
    {
        files: ["**/*.js", "**/*.cjs", "**/*.mjs"],
        languageOptions: {
            globals: {
                es6: true,
                node: true,
                mocha: true
            },
            parserOptions: { "ecmaVersion": 2023 }
        },
        rules: {
            indent: [
                'error',
                4,
                {
                    SwitchCase: 2,
                    VariableDeclarator: {
                        var: 2,
                        let: 2,
                        const: 3,
                    },
                },
            ],
            'linebreak-style': ['error', 'unix'],
            quotes: [
                'error',
                'single',
                {
                    avoidEscape: true,
                },
            ],
            semi: ['error', 'always'],
            'dot-location': ['warn', 'property'],
            eqeqeq: ['error', 'smart'],
            'no-console': 'error',
            'no-eval': 'error',
            'vars-on-top': 'warn',
            'no-unused-vars': [
                'error',
                {
                    vars: 'all',
                    args: 'after-used',
                },
            ],
            camelcase: [
                'error',
                {
                    properties: 'never',
                },
            ],
            'eol-last': ['error', 'always'],
            'max-len': [
                'error',
                {
                    code: 140,
                    comments: 200,
                    tabWidth: 4,
                    ignoreTrailingComments: true,
                },
            ],
            'max-statements': ['warn', 25],
            'no-mixed-spaces-and-tabs': 'error',
            'no-multiple-empty-lines': [
                'warn',
                {
                    max: 2,
                    maxBOF: 0,
                    maxEOF: 1,
                },
            ],
            'no-trailing-spaces': 'error',
            'no-whitespace-before-property': 'error',
            'quote-props': ['error', 'as-needed'],
            'spaced-comment': ['error', 'always'],
            'no-process-exit': 'warn',
            'space-before-function-paren': ['error', {
                "anonymous": "always",
                "named": "never",
                "asyncArrow": "always"
            }],
            'no-unsafe-optional-chaining': 'off',
            'comma-dangle': ['error', 'never'],
            'use-isnan': 'off',

            // Règles spécifique Async promise
            'no-async-promise-executor': 2,
            'no-await-in-loop': 1,
            'no-promise-executor-return': 2,
            'require-atomic-updates': 2,
            'max-nested-callbacks': ['error', 5],
            'no-return-await': 2,
            'prefer-promise-reject-errors': 2,

            // Règles pour node
            'n/no-process-exit': "warn"
        }
    }
];
