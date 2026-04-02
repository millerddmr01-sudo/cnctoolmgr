import initSqlJs from 'sql.js';
import fs from 'fs';
import path from 'path';

const toolsDbPath = 'C:\\Users\\mille\\OneDrive\\Documents\\Website\\assets\\library\\toolsdb';
const existingLibrariesPath = './src/data/toolLibraries.json';
const existingSourcesPath = './src/data/librarySources.json';

initSqlJs().then(function(SQL) {
  let combinedLibrary = [];
  let combinedSources = [];
  
  if (fs.existsSync(existingLibrariesPath)) {
    combinedLibrary = JSON.parse(fs.readFileSync(existingLibrariesPath, 'utf8'));
  }
  if (fs.existsSync(existingSourcesPath)) {
    combinedSources = JSON.parse(fs.readFileSync(existingSourcesPath, 'utf8'));
  }

  const files = fs.readdirSync(toolsDbPath).filter(f => f.endsWith('.vtdb') || f.endsWith('.tool'));
  
  for (const filename of files) {
    if (combinedSources.some(s => s.file === filename)) {
      console.log(`Skipping ${filename}, already imported.`);
      continue;
    }
    
    console.log(`Processing ${filename}...`);
    try {
        const filebuffer = fs.readFileSync(path.join(toolsDbPath, filename));
        const db = new SQL.Database(filebuffer);
        
        const query = `
          SELECT 
            t.name as tree_name,
            g.name_format,
            g.tool_type, g.units as geometry_units, g.diameter, g.num_flutes,
            c.rate_units, c.feed_rate, c.plunge_rate, c.spindle_speed, 
            c.stepdown as pass_depth, c.stepover, c.tool_number,
            t.id as tree_id,
            g.id as geom_id,
            c.id as cut_id
          FROM tool_tree_entry t
          JOIN tool_geometry g ON t.tool_geometry_id = g.id
          LEFT JOIN tool_entity e ON e.tool_geometry_id = g.id
          LEFT JOIN tool_cutting_data c ON e.tool_cutting_data_id = c.id
          WHERE t.tool_geometry_id IS NOT NULL
        `;
        
        const res2 = db.exec(query);
        
        if(res2.length > 0) {
            const columns = res2[0].columns;
            const values = res2[0].values;
            // Best guess for manufacturer name from file title, e.g. "BitsBits" or "IDC"
            const manufacturer = filename.split('-')[0].split('_')[0].split(' ')[0].replace('_', '');
            
            const library = values.map(row => {
                let tool = {};
                columns.forEach((col, i) => { tool[col] = row[i]; });
                tool.display_name = tool.tree_name || tool.name_format || ("Tool " + (tool.diameter || ""));
                tool.manufacturer = manufacturer;
                return tool;
            });
            
            combinedLibrary = combinedLibrary.concat(library);
            combinedSources.push({
               manufacturer: manufacturer,
               date: new Date().toISOString().split('T')[0],
               file: filename
            });
            console.log(`Added ${library.length} tools from ${filename}`);
        } else {
            console.log(`No tools found in ${filename}`);
        }
    } catch (e) {
        console.log(`Error reading ${filename}`, e.message);
    }
  }

  const seen = new Set();
  const deduped = combinedLibrary.filter(t => {
     const name = t.display_name.trim().toLowerCase();
     if(seen.has(name)) return false;
     seen.add(name);
     return true;
  });

  fs.writeFileSync(existingLibrariesPath, JSON.stringify(deduped, null, 2), 'utf8');
  fs.writeFileSync(existingSourcesPath, JSON.stringify(combinedSources, null, 2), 'utf8');
  console.log(`Finished! Total unique tools in library: ${deduped.length}`);
}).catch(console.error);
