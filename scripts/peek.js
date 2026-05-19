import fs from 'fs';

const rawData = fs.readFileSync('scripts/records.mrk.txt', 'utf8');
const rawBooks = rawData.split('*** DOCUMENT BOUNDARY ***').filter(b => b.trim().length > 0);

console.log("🕵️‍♂️ İLK KİTABIN HAM VERİSİ:\n");
console.log(rawBooks[0]);