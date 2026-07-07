// Script: convert-font.js
// Converts a Google Fonts .ttf to Three.js typeface.json using opentype.js
// Usage: node convert-font.js <path-to.ttf> <output.json>

module.paths.push('c:/Users/poshan m s/Documents/A LEARNING/Portfolio/node_modules');

const fs = require('fs');
const path = require('path');

// Check opentype.js availability
let opentype;
try {
  opentype = require('opentype.js');
  console.log('opentype.js found in node_modules');
} catch (e) {
  console.log('opentype.js NOT found:', e.message);
}

// Check if facetype CLI exists
const faceTypePaths = [
  'node_modules/.bin/facetype',
  'node_modules/facetype.js/index.js',
  'node_modules/facetype/index.js',
];

for (const p of faceTypePaths) {
  const full = path.resolve('c:/Users/poshan m s/Documents/A LEARNING/Portfolio', p);
  if (fs.existsSync(full)) {
    console.log('Found facetype at:', full);
  } else {
    console.log('Not found:', full);
  }
}
