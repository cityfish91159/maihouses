import tsParser from '@typescript-eslint/parser';
import tailwindcss from 'eslint-plugin-tailwindcss';
import reactHooks from 'eslint-plugin-react-hooks';
import jsxA11y from 'eslint-plugin-jsx-a11y';

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
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    plugins: {
      tailwindcss,
      'react-hooks': reactHooks,
      'jsx-a11y': jsxA11y,
    },
    rules: {
      // Tailwind
      ...tailwindcss.configs.recommended.rules,
      'tailwindcss/no-custom-classname': 'off',

      // React Hooks
      ...reactHooks.configs.recommended.rules,

      // JSX A11y (Strict)
      ...jsxA11y.configs.recommended.rules,
      'jsx-a11y/click-events-have-key-events': 'warn',
      'jsx-a11y/no-static-element-interactions': 'warn',
      'jsx-a11y/alt-text': 'error',

      // 🛡️ Design Token Guardrails - 禁止所有硬編碼 Hex 顏色
      'no-restricted-syntax': [
        'warn',
        {
          selector: 'Literal[value=/^#([a-fA-F0-9]{3}|[a-fA-F0-9]{6})$/]',
          message: '禁止硬編碼顏色 (Hex Code)。請使用 Tailwind token (例如: brand-700, grade-s-bg, badge-customer-text) 或 CSS 變數 (例如: var(--brand))。'
        },
        {
          selector: 'Literal[value=/rgba?\\(/]',
          message: '禁止硬編碼顏色 (rgba)。請使用 Tailwind opacity utilities (例如: bg-brand/50) 或 CSS 變數。'
        }
      ],
    },
    settings: {
      tailwindcss: {
        config: 'tailwind.config.cjs',
      },
    },
  },
];
