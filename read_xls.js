import xlsx from 'xlsx';
import fs from 'fs';
const wb = xlsx.readFile ? xlsx.readFile('C:\\Users\\mille\\OneDrive\\Documents\\Website\\assets\\library\\FS_worksheet_basics.xls') : xlsx.default.readFile('C:\\Users\\mille\\OneDrive\\Documents\\Website\\assets\\library\\FS_worksheet_basics.xls');
const sheet = wb.Sheets[wb.SheetNames[0]];
const utils = xlsx.utils || xlsx.default.utils;
const rows = utils.sheet_to_json(sheet, {header: 1});
fs.writeFileSync('xls_data.json', JSON.stringify(rows.slice(0, 50), null, 2), 'utf8');
