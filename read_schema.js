import initSqlJs from 'sql.js';
import fs from 'fs';

initSqlJs().then(function(SQL){
  const filebuffer = fs.readFileSync('C:\\ProgramData\\Vectric\\VCarve Pro\\V11.5\\ToolDatabase\\tools.vtdb');
  const db = new SQL.Database(filebuffer);
  const res = db.exec("SELECT name, sql FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'");
  fs.writeFileSync('schema.json', JSON.stringify(res, null, 2), 'utf8');
}).catch(console.error);
