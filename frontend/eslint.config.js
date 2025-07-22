import eslint from '@eslint/js';
import globals from 'globals';
import reactXPlugin from 'eslint-plugin-react-x';
import jsxA11yPlugin from 'eslint-plugin-jsx-a11y';
import reactHooks from 'eslint-plugin-react-hooks';
import tseslint from 'typescript-eslint';
import { globalIgnores } from 'eslint/config';

export default tseslint.config(
    eslint.configs.recommended,
    reactXPlugin.configs.recommended,
    jsxA11yPlugin.flatConfigs.recommended,
    reactHooks.configs['recommended-latest'],
    globalIgnores(['dist']),
    {
        files: ['**/*.{js,jsx}'],
        languageOptions: {
            globals: globals.browser,
        },
    },
    {
        files: ['**/*.{ts,tsx}'],
        extends: [tseslint.configs.recommended, tseslint.configs.stylistic],
    }
);
