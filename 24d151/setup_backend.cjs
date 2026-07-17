const fs = require('fs');
const path = require('path');

const backendDir = path.join(__dirname, 'backend');
const dirs = [
  'app',
  'app/api',
  'app/api/endpoints',
  'app/core',
  'app/models',
  'app/schemas',
  'app/services',
  'app/utils',
];

dirs.forEach(d => {
  const fullPath = path.join(backendDir, d);
  if (!fs.existsSync(fullPath)) fs.mkdirSync(fullPath, { recursive: true });
});

// Write __init__.py files
dirs.forEach(d => {
  fs.writeFileSync(path.join(backendDir, d, '__init__.py'), '', 'utf8');
});

console.log('Backend directory structure created.');
