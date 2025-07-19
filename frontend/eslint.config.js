import js from '@eslint/js';
import globals from 'globals';
import reactPlugin from 'eslint-plugin-react';
import { defineConfig } from 'eslint/config';

export default defineConfig([
    reactPlugin.configs.flat.recommended,
    reactPlugin.configs.flat['jsx-runtime'],
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
