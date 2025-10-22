
const fs = require('fs');
const path = require('path');

function walk(dir, cb) {
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    if (name === 'node_modules') continue;
    if (fs.statSync(full).isDirectory()) walk(full, cb);
    else if (name === 'package.json') cb(full);
  }
}

const errors = [];
walk(process.cwd(), (file) => {
  try {
    const s = fs.readFileSync(file, 'utf8').trim();
    if (s.length === 0) throw new Error('empty file');
    JSON.parse(s);
    console.log('OK:', file);
  } catch (err) {
    console.error('INVALID:', file, '-', err.message);
    errors.push(file);
  }
});

if (errors.length) process.exit(1);