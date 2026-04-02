import React, { useState, useEffect } from 'react';

export default function FeedSpeedCalculator({ onApply }) {
  const [calc, setCalc] = useState({ 
    flutes: 2, 
    diameter: 0.25, 
    chipload: 0.001, 
    feedrate: 60,
    rpm: 12000, 
    woc: 0.01, 
    doc: 0.1 
  });
  const [calcMode, setCalcMode] = useState('feedrate'); // 'feedrate' or 'chipload'
  
  const [computedFeedRate, setComputedFeedRate] = useState(0);
  const [computedChipload, setComputedChipload] = useState(0);

  useEffect(() => {
    const r = calc.diameter / 2;
    let factor = 1;
    if (calc.woc > 0 && calc.woc < r) {
      const wocRatio = calc.woc / r;
      factor = Math.sqrt((2 * wocRatio) - Math.pow(wocRatio, 2));
    }

    if (calcMode === 'feedrate') {
      let feed = calc.rpm * calc.flutes * calc.chipload;
      feed = feed / factor;
      setComputedFeedRate(feed > 0 ? parseFloat(feed.toFixed(2)) : 0);
    } else {
      let chip = calc.feedrate / (calc.rpm * calc.flutes);
      chip = chip * factor;
      setComputedChipload(chip > 0 ? parseFloat(chip.toFixed(5)) : 0);
    }
  }, [calc, calcMode]);

  const handleChange = (e) => {
    let val = parseFloat(e.target.value);
    const name = e.target.name;
    const isNum = !isNaN(val);
    
    setCalc(prev => {
      let nextState = { ...prev, [name]: isNum ? val : '' };
      
      const currentDiameter = name === 'diameter' ? (isNum ? val : 0) : prev.diameter;
      const currentWoc = name === 'woc' ? (isNum ? val : 0) : prev.woc;
      
      if (currentDiameter > 0 && currentWoc > currentDiameter / 2) {
        nextState.woc = currentDiameter / 2;
      }
      
      return nextState;
    });
  };

  const handleApply = () => {
    onApply({
      numFlutes: calc.flutes.toString(),
      diameter: calc.diameter.toString(),
      spindleSpeed: calc.rpm.toString(),
      stepover: calc.woc.toString(),
      passDepth: calc.doc.toString(),
      feedRate: calcMode === 'feedrate' ? computedFeedRate.toString() : calc.feedrate.toString()
    });
  };

  return (
    <div className="glass-panel" style={{ marginTop: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
        <h2 style={{ margin: 0 }}>Advanced Feed & Speeds Calculator</h2>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <select 
            className="btn" 
            style={{ width: 'auto', background: 'var(--primary)', border: 'none', color: 'white' }} 
            value={calcMode} 
            onChange={e => setCalcMode(e.target.value)}
          >
            <option value="feedrate">Calculate Feed Rate</option>
            <option value="chipload">Calculate Chipload</option>
          </select>
          <button className="btn" style={{ width: 'auto' }} onClick={handleApply}>
            Load into Custom Builder ⬆
          </button>
        </div>
      </div>
      
      <div className="grid-3">
        {/* INPUTS COLUMN */}
        <div>
          <h3 style={{ borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.5rem', marginBottom: '1rem' }}>Inputs</h3>
          <div className="form-group">
            <label>Endmill Diameter (in)</label>
            <input type="number" step="0.01" name="diameter" value={calc.diameter} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label>Endmill Flutes</label>
            <input type="number" name="flutes" value={calc.flutes} onChange={handleChange} />
          </div>
          {calcMode === 'feedrate' ? (
            <div className="form-group">
              <label>Target Chipload</label>
              <input type="number" step="0.001" name="chipload" value={calc.chipload} onChange={handleChange} />
            </div>
          ) : (
            <div className="form-group">
              <label>Actual Feedrate (ipm)</label>
              <input type="number" step="1" name="feedrate" value={calc.feedrate} onChange={handleChange} />
            </div>
          )}
          <div className="form-group">
            <label>RPM</label>
            <input type="number" name="rpm" value={calc.rpm} onChange={handleChange} />
          </div>
          <div className="grid-2">
            <div className="form-group">
              <label>WOC (Stepover)</label>
              <input type="number" step="0.01" name="woc" value={calc.woc} onChange={handleChange} />
            </div>
             <div className="form-group">
              <label>DOC (Pass Depth)</label>
              <input type="number" step="0.01" name="doc" value={calc.doc} onChange={handleChange} />
            </div>
          </div>
        </div>

        {/* OUTPUTS & COMPONENT GUIDELINES */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div>
            <h3 style={{ borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.5rem', marginBottom: '1rem' }}>Calculated Output</h3>
            <div style={{ background: 'rgba(99, 102, 241, 0.1)', padding: '1rem', borderRadius: '0.5rem', border: '1px solid var(--primary)' }}>
              {calcMode === 'feedrate' ? (
                <>
                  <label style={{ color: 'var(--text-light)', fontSize: '1.1rem' }}>Required Feedrate (IPM)</label>
                  <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--primary)' }}>{computedFeedRate}</div>
                </>
              ) : (
                <>
                  <label style={{ color: 'var(--text-light)', fontSize: '1.1rem' }}>Actual Chipload (in)</label>
                  <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--primary)' }}>{computedChipload}</div>
                </>
              )}
              <small style={{ color: 'var(--text-muted)' }}>*Includes radial chip thinning compensation where WOC &lt; Radius.</small>
            </div>
          </div>

          <div>
             <h3 style={{ borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.5rem', marginBottom: '1rem' }}>Chipload Guidelines</h3>
             <table style={{ width: '100%', fontSize: '0.9rem', borderCollapse: 'collapse', textAlign: 'left' }}>
               <tbody>
                  <tr style={{ background: 'rgba(255,255,255,0.05)' }}>
                    <th style={{ padding: '0.5rem' }}>1/16" Tool</th>
                    <td style={{ padding: '0.5rem' }}>0.0005" - 0.003"</td>
                  </tr>
                  <tr>
                    <th style={{ padding: '0.5rem' }}>1/8" Tool</th>
                    <td style={{ padding: '0.5rem' }}>0.0005" - 0.005"</td>
                  </tr>
                  <tr style={{ background: 'rgba(255,255,255,0.05)' }}>
                    <th style={{ padding: '0.5rem' }}>1/4" Tool</th>
                    <td style={{ padding: '0.5rem' }}>0.001" - 0.010"</td>
                  </tr>
                  <tr><td colSpan="2" style={{ color: 'var(--text-muted)', paddingTop: '0.5rem' }}>*Harder materials (e.g. Aluminium) require the lower end of the range.</td></tr>
               </tbody>
             </table>
          </div>
        </div>

        {/* EXTENDED GUIDELINES COLUMN */}
        <div style={{ fontSize: '0.9rem' }}>
          <h3 style={{ borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.5rem', marginBottom: '1rem' }}>Milling Style Parameters</h3>
          <p style={{ fontWeight: 'bold', marginTop: '1rem', marginBottom: '0.3rem', color: 'var(--text-light)' }}>Wide & Shallow (Roughing/Pocketing)</p>
          <ul style={{ paddingLeft: '1.2rem', margin: 0, color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
            <li><b>WOC:</b> 0.1" to 0.25"</li>
            <li><b>DOC (Soft):</b> 0.025" to 0.125"</li>
            <li><b>DOC (Hard):</b> 0.0125" to 0.025"</li>
          </ul>

          <p style={{ fontWeight: 'bold', marginTop: '1.5rem', marginBottom: '0.3rem', color: 'var(--text-light)' }}>Narrow & Deep (Slotting/Profiling)</p>
          <ul style={{ paddingLeft: '1.2rem', margin: 0, color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
             <li><b>WOC:</b> 0.025" to 0.0625"</li>
             <li><b>DOC (All):</b> 0.25" to 0.75"</li>
          </ul>

          <p style={{ fontWeight: 'bold', marginTop: '1.5rem', marginBottom: '0.3rem', color: 'var(--text-light)' }}>Straight Plunge Rates</p>
          <ul style={{ paddingLeft: '1.2rem', margin: 0, color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
             <li><b>Soft Woods & Plastics:</b> 24 to 31 IPM</li>
             <li><b>Hard Wood:</b> 18 IPM</li>
             <li><b>Aluminium/Copper:</b> 6 to 18 IPM</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
