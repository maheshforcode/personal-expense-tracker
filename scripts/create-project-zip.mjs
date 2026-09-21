import fs from 'fs';
import path from 'path';
import JSZip from 'jszip';

const zip = new JSZip();

function addDirectoryToZip(dirPath, zipFolder) {
  const items = fs.readdirSync(dirPath);

  for (const item of items) {
    if (
      item === 'node_modules' ||
      item === '.git' ||
      item === 'dist' ||
      item === '.aistudio' ||
      item.endsWith('.zip')
    ) {
      continue;
    }

    const fullPath = path.join(dirPath, item);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      const subFolder = zipFolder.folder(item);
      addDirectoryToZip(fullPath, subFolder);
    } else {
      const content = fs.readFileSync(fullPath);
      zipFolder.file(item, content);
    }
  }
}

async function buildZip() {
  console.log('Packaging project into ZIP...');
  addDirectoryToZip(process.cwd(), zip);

  const buffer = await zip.generateAsync({
    type: 'nodebuffer',
    compression: 'DEFLATE',
    compressionOptions: { level: 9 },
  });

  if (!fs.existsSync('public')) {
    fs.mkdirSync('public', { recursive: true });
  }

  const outputPath = path.join(process.cwd(), 'public', 'personal-expense-tracker.zip');
  fs.writeFileSync(outputPath, buffer);
  console.log(`ZIP created successfully at ${outputPath} (${(buffer.length / 1024).toFixed(1)} KB)`);
}

buildZip().catch(console.error);
