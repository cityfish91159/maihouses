import tsParser from '@typescript-eslint/parser';
import tailwindcss from 'eslint-plugin-tailwindcss';
import reactHooks from 'eslint-plugin-react-hooks';
import jsxA11y from 'eslint-plugin-jsx-a11y';

export default [
  {
    ignores: [
      '**/*.d.ts',
      'node_modules',
      'dist',
      // Private features are intentionally kept out of repository quality gates.
      'src/pages/Admin/GodView.tsx',
      'src/pages/Muse/**',
    ],
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
          // 使用逗號分隔多個 selector，避免 regex 複雜化導致誤判
          selector:
            'Literal[value=/^#(00385a|004E7C|005585|E6EDF7|0f172a|faefe5|92400e|6c7b91|64748b|cbead4|e8faef|107a39)$/i], Literal[value=/^rgba\\(0,\\s*56,\\s*90\\)$/i]',
          message:
            '禁止硬編碼 Brand/Ink/Validation Color。請使用 Tailwind token (brand-700, ink-900, green-700 等) 或 CSS 變數。',
        },
      ],
    },
    settings: {
      tailwindcss: {
        config: 'tailwind.config.cjs',
      },
    },
  },
];
