const fs = require('fs');
const path = require('path');

const nodeModulesPath = 'c:/Users/poshan m s/Documents/A LEARNING/Portfolio/node_modules';

function findDraco(dir) {
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    let stat;
    try { stat = fs.statSync(fullPath); } catch (e) { continue; }
    if (stat.isDirectory()) {
      if (file.toLowerCase().includes('draco')) {
        console.log('Found Draco folder:', fullPath);
      }
      findDraco(fullPath);
    }
  }
}

console.log('Searching for "draco" in node_modules...');
findDraco(nodeModulesPath);
console.log('Done searching.');
