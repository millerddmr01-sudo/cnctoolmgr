import React, { useState } from 'react';
import initSqlJs from 'sql.js';
import sqlWasm from 'sql.js/dist/sql-wasm.wasm?url';
import ToolForm from './components/ToolForm';
import ToolLibrary from './components/ToolLibrary';
import ExportCart from './components/ExportCart';
import FeedSpeedCalculator from './components/FeedSpeedCalculator';
import './index.css';

function App() {
  const [selectedTools, setSelectedTools] = useState([]);
  const [calculatorOverrides, setCalculatorOverrides] = useState(null);

  const addToCart = (tool) => {
    setSelectedTools(prev => [...prev, { ...tool, cartId: crypto.randomUUID() }]);
  };
  
  const removeFromCart = (cartId) => {
    setSelectedTools(prev => prev.filter(t => t.cartId !== cartId));
  };

  const exportVtdb = async () => {
    try {
      if(selectedTools.length === 0) {
        alert("Your cart is empty! Please add tools to your cart before exporting.");
        return;
      }
      
      const SQL = await initSqlJs({
        locateFile: () => sqlWasm
      });
    
    const db = new SQL.Database();
    
    // Recreate the complete strict VCarve schema
    db.run(`
      CREATE TABLE "migration" ("version" INTEGER NOT NULL, "subversion" INTEGER NOT NULL, "name" TEXT NOT NULL, "checksum" TEXT NOT NULL, PRIMARY KEY("version","subversion"));
      CREATE TABLE "version" ("version" INTEGER NOT NULL UNIQUE, PRIMARY KEY("version"));
      CREATE TABLE "machine" ("id" TEXT NOT NULL UNIQUE, "name" TEXT NOT NULL UNIQUE, "make" TEXT, "model" TEXT, "controller_type" TEXT, "dimensions_units" INTEGER, "max_width" REAL, "max_height" REAL, "support_rotary" INTEGER, "support_tool_change" INTEGER, "has_laser_head" INTEGER, PRIMARY KEY("id"));
      CREATE TABLE "material" ("id" TEXT NOT NULL UNIQUE, "name" TEXT NOT NULL UNIQUE, PRIMARY KEY("id"));
      CREATE TABLE "drill_bank_data" ("id" TEXT NOT NULL UNIQUE, "num_horizontal_drills" INTEGER NOT NULL, "num_vertical_drills" INTEGER NOT NULL, "drill_bank_pitch" REAL NOT NULL, "horizontal_centre_index" INTEGER NOT NULL, "vertical_centre_index" INTEGER NOT NULL, "origin_index" INTEGER NOT NULL, "supports_variable_depth" INTEGER NOT NULL, PRIMARY KEY("id"));
      CREATE TABLE "tool_geometry" ("id" TEXT NOT NULL UNIQUE, "name_format" TEXT NOT NULL, "notes" TEXT, "tool_type" INTEGER NOT NULL, "units" INTEGER NOT NULL, "diameter" REAL, "included_angle" REAL, "flat_diameter" REAL, "num_flutes" INTEGER, "flute_length" REAL, "thread_pitch" REAL, "outline" BLOB, "tip_radius" REAL, "laser_watt" INTEGER, "custom_attributes" TEXT, "tooth_size" REAL, "tooth_offset" REAL, "neck_length" REAL, "tooth_height" REAL, "threaded_length" REAL, "drill_bank_data_id" TEXT, FOREIGN KEY("drill_bank_data_id") REFERENCES "drill_bank_data" ("id"), PRIMARY KEY("id"));
      CREATE TABLE "drill_bank_drill" ("id" TEXT NOT NULL UNIQUE, "drill_bank_data_id" TEXT NOT NULL, "global_index" INTEGER NOT NULL, "horizontal_index" INTEGER NOT NULL, "vertical_index" INTEGER NOT NULL, "user_drill_number" INTEGER NOT NULL, "on_horizontal" INTEGER NOT NULL, "on_vertical" INTEGER NOT NULL, "diameter" REAL NOT NULL, FOREIGN KEY("drill_bank_data_id") REFERENCES "drill_bank_data" ("id"), PRIMARY KEY("id"));
      CREATE TABLE "tool_cutting_data" ("id" TEXT NOT NULL UNIQUE, "rate_units" INTEGER NOT NULL, "feed_rate" REAL, "plunge_rate" REAL, "spindle_speed" INTEGER, "spindle_dir" INTEGER, "stepdown" REAL, "stepover" REAL, "clear_stepover" REAL, "thread_depth" REAL, "thread_step_in" REAL, "laser_power" REAL, "laser_passes" INTEGER, "laser_burn_rate" REAL, "line_width" REAL, "length_units" INTEGER NOT NULL DEFAULT 0, "tool_number" INTEGER, "laser_kerf" INTEGER, "notes" TEXT, PRIMARY KEY("id"));
      CREATE TABLE "tool_entity" ("id" TEXT NOT NULL UNIQUE, "material_id" TEXT, "machine_id" TEXT, "tool_geometry_id" TEXT, "tool_cutting_data_id" TEXT NOT NULL, PRIMARY KEY("tool_geometry_id","material_id","machine_id"), FOREIGN KEY("material_id") REFERENCES "material"("id"), FOREIGN KEY("machine_id") REFERENCES "machine"("id"), FOREIGN KEY("tool_geometry_id") REFERENCES "tool_geometry"("id"), FOREIGN KEY("tool_cutting_data_id") REFERENCES "tool_cutting_data"("id"));
      CREATE TABLE "tool_tree_entry" ("id" TEXT NOT NULL UNIQUE, "parent_group_id" TEXT, "sibling_order" INTEGER NOT NULL, "tool_geometry_id" TEXT UNIQUE, "name" TEXT, "notes" TEXT, "expanded" INTEGER, FOREIGN KEY("tool_geometry_id") REFERENCES "tool_geometry"("id"), PRIMARY KEY("id","parent_group_id","sibling_order"), FOREIGN KEY("parent_group_id") REFERENCES "tool_tree_entry"("id"));
      CREATE TABLE "tool_name_format" ("id" TEXT NOT NULL, "tool_type" INTEGER NOT NULL UNIQUE, "format" TEXT NOT NULL, PRIMARY KEY("id","tool_type"));
      CREATE TABLE "upload_data" ("id" INTEGER NOT NULL UNIQUE, "date_uploaded" INTEGER NOT NULL, PRIMARY KEY("id"));
    `);

    db.run(`INSERT INTO version (version) VALUES (24)`); // Standard V11.5 version code
    
    const rootTreeId = crypto.randomUUID();
    db.run(`INSERT INTO tool_tree_entry (id, name, sibling_order) VALUES (?, ?, 0)`, [rootTreeId, "Exported Tools"]);
    
    selectedTools.forEach((tool, i) => {
        const uuid = crypto.randomUUID();
        const geomId = crypto.randomUUID();
        const cutId = crypto.randomUUID();
        const treeId = crypto.randomUUID();
        
        let toolName = tool.toolName || tool.display_name;
        if (!toolName) {
            const unitsText = (tool.geometryUnits === '0' || tool.geometryUnits === 0) ? 'in' : 'mm';
            const prefix = tool.manufacturer ? tool.manufacturer : 'Custom';
            toolName = `${prefix} Tool - ${tool.diameter}${unitsText}`;
        }

        // Geometry
        db.run(`INSERT INTO tool_geometry (id, name_format, tool_type, units, diameter, num_flutes, notes) VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [geomId, "{ToolType} {Diameter} {Units}", parseInt(tool.toolType ?? tool.tool_type ?? 1), parseInt(tool.geometryUnits ?? tool.geometry_units ?? 0), parseFloat(tool.diameter ?? 0.25), parseInt(tool.numFlutes ?? tool.num_flutes ?? 2), tool.notes || '']
        );

        // Cutting Data
        db.run(`INSERT INTO tool_cutting_data (id, rate_units, feed_rate, plunge_rate, spindle_speed, stepdown, stepover, tool_number) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [cutId, parseInt(tool.rateUnits ?? tool.rate_units ?? 0), parseFloat(tool.feedRate ?? tool.feed_rate ?? 60), parseFloat(tool.plungeRate ?? tool.plunge_rate ?? 30), parseInt(tool.spindleSpeed ?? tool.spindle_speed ?? 12000), parseFloat(tool.passDepth ?? tool.pass_depth ?? 0.125), parseFloat(tool.stepover ?? 0.1), parseInt(tool.toolNumber ?? tool.tool_number ?? 1)]
        );

        // Entities
        db.run(`INSERT INTO tool_entity (id, tool_geometry_id, tool_cutting_data_id) VALUES (?, ?, ?)`, [uuid, geomId, cutId]);
        
        // Tree
        db.run(`INSERT INTO tool_tree_entry (id, parent_group_id, tool_geometry_id, name, sibling_order) VALUES (?, ?, ?, ?, ?)`, [treeId, rootTreeId, geomId, toolName, i]);
    });

    const data = db.export();
    const blob = new Blob([data], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `exported_tools_${Date.now()}.vtdb`;
      a.click();
    } catch(err) {
      console.error(err);
      alert(`Export Error: ${err.message}`);
    }
  };

  return (
    <div className="app-container" style={{ maxWidth: '1400px' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ margin: 0 }}>CNCToolMgr</h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>Search libraries, customize tools, and bundle them into VCarve Pro</p>
        </div>
        <a 
          href="mailto:millerddmr01@gmail.com" 
          className="btn" 
          style={{ width: 'auto', textDecoration: 'none', padding: '0.6rem 1.2rem', background: 'var(--glass-bg)', border: '1px solid var(--primary)', alignSelf: 'center' }}
        >
          ✉ Contact Us
        </a>
      </header>

      <div className="dashboard-grid">
        <ToolLibrary onAdd={addToCart} />
        <ToolForm onAdd={addToCart} overrideData={calculatorOverrides} />
        <ExportCart items={selectedTools} onRemove={removeFromCart} onExport={exportVtdb} />
      </div>

      <FeedSpeedCalculator onApply={setCalculatorOverrides} />
    </div>
  );
}

export default App;
