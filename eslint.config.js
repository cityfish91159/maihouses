import tsParser from '@typescript-eslint/parser';
import tailwindcss from 'eslint-plugin-tailwindcss';

export default [
  {
    ignores: ['**/*.d.ts', 'node_modules', 'dist'],
  },
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      parser: tsParser,
    },
    plugins: {
      tailwindcss,
    },
    rules: {
      // start from recommended rules, but allow custom classnames used in this project
      ...tailwindcss.configs.recommended.rules,
      // project uses several custom utility-like classnames (e.g. menu-icon, pill-*)
      // disable the no-custom-classname rule to avoid false positives
      'tailwindcss/no-custom-classname': 'off',
    },
    settings: {
      tailwindcss: {
        config: 'tailwind.config.cjs',
      },
    },
  },
];
