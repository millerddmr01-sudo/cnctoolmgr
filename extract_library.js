import initSqlJs from 'sql.js';
import fs from 'fs';

initSqlJs().then(function(SQL){
  const filebuffer = fs.readFileSync('C:\\Users\\mille\\OneDrive\\Documents\\Website\\assets\\library\\Amana-Tool-Vectric-12-5-2025.vtdb');
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
      const library = values.map(row => {
          let tool = {};
          columns.forEach((col, i) => { tool[col] = row[i]; });
          // Fallback name
          tool.display_name = tool.tree_name || tool.name_format || ("Tool " + (tool.diameter || ""));
          return tool;
      });
      fs.mkdirSync('./src/data', { recursive: true });
      fs.writeFileSync('./src/data/toolLibraries.json', JSON.stringify(library, null, 2), 'utf8');
      console.log('Extracted', library.length, 'tools!');
  } else {
      console.log('No tools found from join!');
  }
}).catch(console.error);
