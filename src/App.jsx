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
    
      // Fetch the strict baseline Vectric Template database
      const response = await fetch('/base.vtdb');
      const buffer = await response.arrayBuffer();
      const db = new SQL.Database(new Uint8Array(buffer));
    
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
