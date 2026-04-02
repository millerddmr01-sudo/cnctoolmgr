import React, { useState, useEffect } from 'react';

export default function ToolForm({ onAdd, overrideData }) {
  const [formData, setFormData] = useState({
    manufacturer: '',
    notes: '',
    toolType: '1',
    toolNumber: '1',
    numFlutes: '2',
    diameter: '0.25',
    geometryUnits: '0',
    passDepth: '0.125',
    stepover: '0.1',
    spindleSpeed: '12000',
    feedRate: '60',
    plungeRate: '30',
    rateUnits: '0'
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => {
      let nextState = { ...prev, [name]: value };
      
      const dia = parseFloat(name === 'diameter' ? value : prev.diameter) || 0;
      let step = parseFloat(name === 'stepover' ? value : prev.stepover);
      
      if (dia > 0 && !isNaN(step) && step > dia / 2) {
        nextState.stepover = (dia / 2).toString();
      }
      
      return nextState;
    });
  };

  useEffect(() => {
    if(overrideData) {
      setFormData(prev => ({ ...prev, ...overrideData }));
    }
  }, [overrideData]);

  const handleAdd = () => {
    // Send a copy so we can make more custom tools
    onAdd({ ...formData });
  };

  return (
    <div className="glass-panel" style={{ height: '600px', display: 'flex', flexDirection: 'column' }}>
      <h2>Build Custom Tool</h2>
      <div style={{ overflowY: 'auto', flex: 1, paddingRight: '0.5rem', marginBottom: '1rem' }}>
        <div className="form-group">
          <label>Manufacturer</label>
          <input type="text" name="manufacturer" value={formData.manufacturer} onChange={handleChange} placeholder="e.g. Whiteside, Amana..." />
        </div>
        <div className="grid-2">
          <div className="form-group">
            <label>Tool Type</label>
            <select name="toolType" value={formData.toolType} onChange={handleChange}>
              <option value="1">End Mill</option>
              <option value="2">Ball Nose</option>
              <option value="3">V-Bit</option>
            </select>
          </div>
          <div className="form-group">
            <label>Tool Number</label>
            <input type="number" name="toolNumber" value={formData.toolNumber} onChange={handleChange} min="1" />
          </div>
        </div>
        
        <div className="grid-2">
           <div className="form-group">
            <label>Number of Flutes</label>
            <input type="number" name="numFlutes" value={formData.numFlutes} onChange={handleChange} min="1" />
          </div>
          <div className="form-group">
            <label>Geometry Units</label>
            <select name="geometryUnits" value={formData.geometryUnits} onChange={handleChange}>
              <option value="0">Inches</option>
              <option value="1">Millimeters</option>
            </select>
          </div>
        </div>
        
        <div className="form-group">
            <label>Diameter</label>
            <input type="number" step="0.01" name="diameter" value={formData.diameter} onChange={handleChange} />
        </div>

        <h3 style={{ marginTop: '1rem', marginBottom: '0.5rem', fontSize: '1.1rem' }}>Cutting Parameters</h3>
        <div className="grid-2">
          <div className="form-group">
            <label>Pass Depth</label>
            <input type="number" step="0.01" name="passDepth" value={formData.passDepth} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label>Stepover</label>
            <input type="number" step="0.01" name="stepover" value={formData.stepover} onChange={handleChange} />
          </div>
        </div>

        <h3 style={{ marginTop: '1rem', marginBottom: '0.5rem', fontSize: '1.1rem' }}>Feeds & Speeds</h3>
        <div className="grid-2">
          <div className="form-group">
            <label>Spindle Speed (RPM)</label>
            <input type="number" name="spindleSpeed" value={formData.spindleSpeed} onChange={handleChange} />
          </div>
           <div className="form-group">
            <label>Feed/Plunge Units</label>
            <select name="rateUnits" value={formData.rateUnits} onChange={handleChange}>
              <option value="0">Inches / min</option>
              <option value="1">mm / min</option>
              <option value="2">Inches / sec</option>
              <option value="3">mm / sec</option>
            </select>
          </div>
        </div>
        
        <div className="grid-2">
           <div className="form-group">
            <label>Feed Rate</label>
            <input type="number" step="0.1" name="feedRate" value={formData.feedRate} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label>Plunge Rate</label>
            <input type="number" step="0.1" name="plungeRate" value={formData.plungeRate} onChange={handleChange} />
          </div>
        </div>

        <div className="form-group" style={{ marginTop: '1rem' }}>
          <label>Notes</label>
          <textarea 
            name="notes" 
            value={formData.notes} 
            onChange={handleChange} 
            placeholder="Add any special instructions or details about this bit..."
            style={{ 
              width: '100%', 
              padding: '0.75rem 1rem',
              backgroundColor: 'rgba(15, 23, 42, 0.6)',
              border: '1px solid var(--glass-border)',
              borderRadius: '0.5rem',
              color: 'var(--text-light)',
              minHeight: '60px',
              fontFamily: 'inherit'
            }}
          />
        </div>

      </div>
      
      <button className="btn" onClick={handleAdd}> Add Custom to Queue </button>
    </div>
  );
}
