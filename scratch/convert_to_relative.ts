import fs from 'fs';
import path from 'path';

const baseDir = 'src';

function processDir(dir: string) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      processDir(fullPath);
    } else if (entry.name.endsWith('.tsx') || entry.name.endsWith('.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      const originalContent = content;
      
      // Replace @/ with relative path
      // Logic: calculate relative path from current file to src
      const depth = fullPath.split(path.sep).length - 1; // src is depth 1
      const relativePrefix = '../'.repeat(depth - 1) || './';
      
      content = content.replace(/from\s+['"]@\/([^'"]+)['"]/g, (match, p1) => {
        // p1 is the path after @/, e.g. "lib/utils"
        // We need to construct the relative path
        const fileDir = path.dirname(fullPath);
        const targetPath = path.join(baseDir, p1);
        let relativeTarget = path.relative(fileDir, targetPath).replace(/\\/g, '/');
        if (!relativeTarget.startsWith('.')) relativeTarget = './' + relativeTarget;
        return `from "${relativeTarget}"`;
      });

      if (content !== originalContent) {
        fs.writeFileSync(fullPath, content);
        console.log(`[FIXED] ${fullPath}`);
      }
    }
  }
}

processDir(baseDir);
