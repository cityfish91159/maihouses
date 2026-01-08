const fs = require("fs");
const path = require("path");

// Files that need Mock type import
const filesNeedingMockType = [
  "src/hooks/__tests__/useCommunityWallQuery.test.tsx",
  "src/pages/UAG/__tests__/purchaseLead.test.ts",
];

// Add Mock type import
for (const file of filesNeedingMockType) {
  const fullPath = path.join(process.cwd(), file);
  if (!fs.existsSync(fullPath)) {
    console.log(`Skip ${file} - not found`);
    continue;
  }

  let content = fs.readFileSync(fullPath, "utf8");

  // Check if already has Mock import
  if (content.includes("import type { Mock } from 'vitest'")) {
    console.log(`Skip ${file} - already has Mock import`);
    continue;
  }

  // Find first import line and add after it
  const lines = content.split("\n");
  let insertIndex = 0;
  for (let i = 0; i < lines.length; i++) {
    if (
      lines[i].startsWith("import ") &&
      lines[i].includes("from '@testing-library")
    ) {
      insertIndex = i + 1;
      break;
    }
  }

  if (insertIndex > 0) {
    lines.splice(insertIndex, 0, "import type { Mock } from 'vitest';");
    content = lines.join("\n");
    fs.writeFileSync(fullPath, content, "utf8");
    console.log(`✓ Added Mock import to ${file}`);
  }
}

console.log("\nDone!");
