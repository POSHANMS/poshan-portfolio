const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const outputFile = path.join(rootDir, 'project_codebase.md');

const ignoreDirs = ['.next', 'node_modules', '.git', '.pnpm-store'];
const ignoreExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.ico', '.glb', '.ttf', '.tsbuildinfo', '.svg', '.pdf', '.mp3'];

function shouldProcess(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const relPath = path.relative(rootDir, filePath).replace(/\\/g, '/');

  // Ignore images and binary assets
  if (ignoreExtensions.includes(ext)) return false;

  // Ignore typeface JSONs in public/fonts since they are massive font glyph data
  if (relPath.startsWith('public/fonts/') && ext === '.json') return false;

  // Ignore generated codebase backup itself
  if (relPath === 'project_codebase.md') return false;

  return true;
}

const fileList = [];

function traverse(dir) {
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const relPath = path.relative(rootDir, fullPath);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      if (ignoreDirs.includes(file)) continue;
      traverse(fullPath);
    } else {
      if (shouldProcess(fullPath)) {
        fileList.push({ relPath, fullPath });
      }
    }
  }
}

// Traverse directories
traverse(path.join(rootDir, 'src'));
traverse(path.join(rootDir, 'scratch'));

// Include root configuration files
const rootConfigs = [
  'package.json',
  'tsconfig.json',
  'tailwind.config.ts',
  'next.config.mjs',
  'postcss.config.mjs',
  '.eslintrc.json',
  '.gitignore',
  'AGENTS.md'
];

for (const file of rootConfigs) {
  const fullPath = path.join(rootDir, file);
  if (fs.existsSync(fullPath) && shouldProcess(fullPath)) {
    fileList.push({ relPath: file, fullPath });
  }
}

// Open write stream
const stream = fs.createWriteStream(outputFile, { encoding: 'utf8' });
stream.write('# Project Codebase Backup\n\n');

for (const { relPath, fullPath } of fileList) {
  // Do not include the script itself
  if (relPath.includes('generate_codebase_md.js')) continue;

  const content = fs.readFileSync(fullPath, 'utf8');
  const normalizedPath = relPath.replace(/\\/g, '/');
  
  // Determine language tag for markdown block
  let lang = 'text';
  if (relPath.endsWith('.ts') || relPath.endsWith('.tsx')) lang = 'typescript';
  else if (relPath.endsWith('.css')) lang = 'css';
  else if (relPath.endsWith('.json')) lang = 'json';
  else if (relPath.endsWith('.js') || relPath.endsWith('.mjs')) lang = 'javascript';
  else if (relPath.endsWith('.frag') || relPath.endsWith('.vert')) lang = 'glsl';
  else if (relPath.endsWith('.md')) lang = 'markdown';
  
  stream.write(`## File: \`${normalizedPath}\`\n\n`);
  stream.write('```' + lang + '\n');
  stream.write(content);
  if (!content.endsWith('\n')) {
    stream.write('\n');
  }
  stream.write('```\n\n');
}

stream.end();
console.log('Successfully generated project_codebase.md!');
