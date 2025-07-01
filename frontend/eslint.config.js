import js from '@eslint/js';
import globals from 'globals';
import react from 'eslint-plugin-react';
import { defineConfig } from 'eslint/config';

export default defineConfig([
    react.configs.flat.recommended,
    react.configs.flat['jsx-runtime'],
    js.configs.recommended,
    {
        files: ['**/*.{js,jsx}'],
        languageOptions: {
            ecmaVersion: 2022,
            globals: globals.browser,
        },
        rules: {
            'react/prop-types': 'off',
        },
    },
]);
