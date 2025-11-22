
const fs = require('fs');
const path = require('path');
const filePath = path.join(process.cwd(), 'node_modules/libp2p/src/libp2p.ts');
try {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    console.log(lines.slice(100, 250).join('\n'));
} catch (err) {
    console.error(err);
}
