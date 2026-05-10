import fs from 'fs';
import path from 'path';

const srcDir = 'src';

function getFiles(dir: string): string[] {
  const subdirs = fs.readdirSync(dir);
  const files = subdirs.map((subdir) => {
    const res = path.resolve(dir, subdir);
    return fs.statSync(res).isDirectory() ? getFiles(res) : res;
  });
  return Array.prototype.concat(...files);
}

const allFiles = getFiles(srcDir).filter(f => f.endsWith('.ts') || f.endsWith('.tsx'));

const aliasMap: Record<string, string> = {
  '@/': 'src/',
};

let missingCount = 0;

allFiles.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  const importRegex = /from\s+['"](@\/[^'"]+)['"]/g;
  let match;
  while ((match = importRegex.exec(content)) !== null) {
    const importPath = match[1];
    let resolvedPath = importPath;
    for (const [alias, replacement] of Object.entries(aliasMap)) {
      if (importPath.startsWith(alias)) {
        resolvedPath = importPath.replace(alias, replacement);
        break;
      }
    }

    const possibleExtensions = ['', '.ts', '.tsx', '.js', '.jsx', '.css', '/index.ts', '/index.tsx'];
    let found = false;
    for (const ext of possibleExtensions) {
      if (fs.existsSync(path.resolve(resolvedPath + ext))) {
        found = true;
        break;
      }
    }

    if (!found) {
      console.log(`[MISSING] ${file}: ${importPath} (Resolved: ${resolvedPath})`);
      missingCount++;
    }
  }
});

console.log(`Total missing imports: ${missingCount}`);
