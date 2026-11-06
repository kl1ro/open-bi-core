import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import globals from 'globals';
import prettierPlugin from 'eslint-plugin-prettier';
import importPlugin from 'eslint-plugin-import';
import { globalIgnores } from 'eslint/config';

export default tseslint.config(
  globalIgnores(['node_modules/', 'dist/', 'build/', '.next/', 'out/']),
  {
    ignores: ['eslint.config.mjs', 'postcss.config.mjs'],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  {
    languageOptions: {
      globals: {
        ...globals.node,
      },
      ecmaVersion: 2022,
      sourceType: 'module',
      parserOptions: {
        project: './tsconfig.json',
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: {
      prettier: prettierPlugin,
      import: importPlugin,
    },
    rules: {
      // TypeScript
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-floating-promises': 'warn',
      '@typescript-eslint/no-unsafe-argument': 'warn',
      '@typescript-eslint/no-unsafe-assignment': 'warn',
      '@typescript-eslint/no-unsafe-return': 'warn',
			'@typescript-eslint/explicit-member-accessibility': 'warn',

			"@typescript-eslint/consistent-type-imports": [
				"warn",
				{ prefer: "type-imports", fixStyle: "inline-type-imports" },
			],

			"@typescript-eslint/no-import-type-side-effects": "warn",
			"import/no-duplicates": ["warn"],
			
      '@typescript-eslint/no-unused-vars': [
        'error',
        { ignoreRestSiblings: true, argsIgnorePattern: '^_' },
      ],
			'@typescript-eslint/no-misused-promises': "off",
			
			"@typescript-eslint/naming-convention": [
				"error",
				{ selector: "import", format: ["camelCase", "PascalCase"] },
				{ selector: "default", format: ["camelCase"] },
				{ selector: "typeLike", format: ["PascalCase"] },
				{ selector: "function", format: ["camelCase", "PascalCase"] },
				{ selector: "variable", format: ["camelCase", "PascalCase", "UPPER_CASE"] },
				{
					selector: "variable",
					modifiers: ["const", "global"],
					types: ["boolean", "string", "number"],
					format: ["UPPER_CASE"],
				},
				{ selector: ["objectLiteralProperty", "typeProperty"], format: null },
			],

			"no-restricted-syntax": [
				"error",
				{
					selector: "ClassDeclaration[superClass.name=/Error$/][id.name!=/Error$/]",
					message: "Error class names should end with 'Error'",
				},
			],

      // Import
      'import/order': [
        'warn',
        {
          groups: ['builtin', 'external', 'internal', ['parent', 'sibling', 'index']],
          'newlines-between': 'always',
        },
      ],

      // JS
      'no-var': 'off',
      eqeqeq: ['error', 'always'],

      // Prettier
      'prettier/prettier': 'error',
    },
  }
);
