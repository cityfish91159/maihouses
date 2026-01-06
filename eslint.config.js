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

      // 🛡️ Design Token Guardrails - 禁止硬編碼 Brand/Ink Hex Codes
      'no-restricted-syntax': [
        'warn',
        {
          selector: 'Literal[value=/#00385a|#004E7C|#005585|#E6EDF7|#0f172a/i]',
          message: '禁止硬編碼 Brand/Ink Color。請使用 Tailwind token (brand-700, ink-900 等) 或 CSS 變數 (var(--ink))。'
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
