const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

/**
 * Remove vitest imports from test files to use global mode
 * This fixes "No test suite found" errors in Vitest 4.0.16
 */
function fixVitestImports() {
  // Find all test files using ripgrep
  const output = execSync(
    'git ls-files "*.test.ts" "*.test.tsx" "*.spec.ts" "*.spec.tsx"',
    {
      encoding: "utf8",
      cwd: process.cwd(),
    },
  );

  const testFiles = output
    .trim()
    .split("\n")
    .filter(Boolean)
    .map((f) => path.join(process.cwd(), f));

  console.log(`Found ${testFiles.length} test files to process`);

  let fixed = 0;
  let skipped = 0;

  for (const file of testFiles) {
    try {
      const content = fs.readFileSync(file, "utf8");

      // Patterns to remove
      const patterns = [
        // Full vitest import lines
        /import\s+\{[^}]*\}\s+from\s+['"]vitest['"]\s*;?\r?\n/g,
        // Default import
        /import\s+vitest\s+from\s+['"]vitest['"]\s*;?\r?\n/g,
        // Type import
        /import\s+type\s+\{[^}]*\}\s+from\s+['"]vitest['"]\s*;?\r?\n/g,
      ];

      let newContent = content;
      let changed = false;

      for (const pattern of patterns) {
        if (pattern.test(newContent)) {
          newContent = newContent.replace(pattern, "");
          changed = true;
        }
      }

      if (changed) {
        fs.writeFileSync(file, newContent, "utf8");
        console.log(`✓ Fixed: ${path.relative(process.cwd(), file)}`);
        fixed++;
      } else {
        skipped++;
      }
    } catch (error) {
      console.error(`✗ Error processing ${file}:`, error.message);
    }
  }

  console.log(`\nSummary:`);
  console.log(`  Fixed: ${fixed} files`);
  console.log(`  Skipped: ${skipped} files (already correct)`);
  console.log(`  Total: ${testFiles.length} files`);
}

fixVitestImports();
