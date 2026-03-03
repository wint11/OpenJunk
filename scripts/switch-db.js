const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
let target = args[0] || 'auto'; // default to auto

if (target === 'auto') {
  if (process.env.VERCEL || process.env.NODE_ENV === 'production') {
    target = 'postgres';
    console.log('Auto-detected environment: using postgres');
  } else {
    target = 'sqlite';
    console.log('Auto-detected environment: using sqlite');
  }
}

if (target !== 'sqlite' && target !== 'postgres') {
  console.error('Please specify target: sqlite, postgres, or auto');
  process.exit(1);
}

const sourceFile = path.join(__dirname, `../prisma/schema.${target}.prisma`);
const destFile = path.join(__dirname, '../prisma/schema.prisma');

if (!fs.existsSync(sourceFile)) {
  console.error(`Source file not found: ${sourceFile}`);
  process.exit(1);
}

const content = fs.readFileSync(sourceFile, 'utf8');
const warning = `// *** GENERATED FILE - DO NOT EDIT DIRECTLY ***
// Edit schema.sqlite.prisma or schema.postgres.prisma instead.
// Run "npm run db:switch:local" or "npm run db:switch:prod" to update.

`;

fs.writeFileSync(destFile, warning + content);
console.log(`Switched schema to ${target}`);
