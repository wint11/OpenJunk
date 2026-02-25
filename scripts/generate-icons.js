
const fs = require('fs');
const path = require('path');

const targetDir = path.join(__dirname, '../mobile-app/static/tabbar');

if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
}

// 1x1 transparent PNG pixel
const buffer = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=', 'base64');

['paper.png', 'paper-active.png', 'trend.png', 'trend-active.png', 'journal.png', 'journal-active.png'].forEach(file => {
    fs.writeFileSync(path.join(targetDir, file), buffer);
});

console.log('Icons generated successfully.');
