const fs = require('fs');
const path = require('path');

const id = process.argv[2];
if (!id) {
  console.error('usage: node scripts/test-verify.js <DC_ID>');
  process.exit(1);
}

const file = path.join(process.cwd(), 'db', 'trainees.json');
const contents = fs.readFileSync(file, 'utf8') || '[]';
let arr = [];
try {
  arr = JSON.parse(contents || '[]');
} catch (e) {
  console.error('failed parsing trainees.json', e);
  process.exit(2);
}

const key = String(id).toUpperCase();
const found = arr.find((x) => x.dc_id && x.dc_id.toUpperCase() === key);
if (found) {
  const out = {
    found: true,
    name: found.name,
    email: found.email || null,
    courseName: found.courseName || null,
    location: found.location || null,
    phone: found.phone || null,
    date: found.date ? new Date(found.date).toLocaleDateString('en-GB') : null,
    dc_id: found.dc_id,
  };
  console.log(JSON.stringify(out, null, 2));
  process.exit(0);
}

console.log(JSON.stringify({ found: false }, null, 2));
process.exit(0);
