const fs = require('fs');
const path = require('path');

const fixes = [
  {
    file: 'src/features/home/sections/__tests__/CommunityTeaser.test.tsx',
    replacements: [
      {
        old: `expect(screen.getByText(\`\${BACKUP_REVIEWS[0].name}: \${BACKUP_REVIEWS[0].content}\`)).toBeInTheDocument();`,
        new: `expect(screen.getByText(\`\${BACKUP_REVIEWS[0]?.name}: \${BACKUP_REVIEWS[0]?.content}\`)).toBeInTheDocument();`,
      },
    ],
  },
  {
    file: 'src/hooks/__tests__/useNotifications.test.ts',
    patterns: [
      { search: /notification\.id/g, replace: 'notification?.id' },
      { search: /notification\.type/g, replace: 'notification?.type' },
      { search: /notification\.title/g, replace: 'notification?.title' },
      { search: /notification\.message/g, replace: 'notification?.message' },
      { search: /result\.current\.(\w+)\[0\]\.id/g, replace: 'result.current.$1[0]?.id' },
      { search: /result\.current\.(\w+)\[0\]\.type/g, replace: 'result.current.$1[0]?.type' },
    ],
  },
  {
    file: 'src/pages/Feed/__tests__/P6_Refactor.test.tsx',
    patterns: [
      { search: /screen\.getByTestId\('([^']+)'\)\[0\]/g, replace: "screen.getByTestId('$1')[0]" },
      { search: /\.children\[0\]\.textContent/g, replace: '.children[0]?.textContent' },
    ],
  },
];

for (const fix of fixes) {
  const fullPath = path.join(process.cwd(), fix.file);

  if (!fs.existsSync(fullPath)) {
    console.log(`Skip ${fix.file} - not found`);
    continue;
  }

  let content = fs.readFileSync(fullPath, 'utf8');
  let changed = false;

  // Apply direct replacements
  if (fix.replacements) {
    for (const { old, new: newText } of fix.replacements) {
      if (content.includes(old)) {
        content = content.replace(old, newText);
        changed = true;
      }
    }
  }

  // Apply pattern replacements
  if (fix.patterns) {
    for (const { search, replace } of fix.patterns) {
      const newContent = content.replace(search, replace);
      if (newContent !== content) {
        content = newContent;
        changed = true;
      }
    }
  }

  if (changed) {
    fs.writeFileSync(fullPath, content, 'utf8');
    console.log(`✓ Fixed ${fix.file}`);
  }
}

console.log('\nDone!');
