import React, { useState, useMemo } from 'react';
import toolsData from '../data/toolLibraries.json';
import librarySources from '../data/librarySources.json';

export default function ToolLibrary({ onAdd }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showInfo, setShowInfo] = useState(false);
  const [displayCount, setDisplayCount] = useState(60);

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setDisplayCount(60); // Reset scroll rendering when searching
  };

  const filteredTools = useMemo(() => {
    return toolsData.filter(t => 
      (t.display_name && t.display_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (t.diameter && t.diameter.toString().includes(searchTerm))
    ).slice(0, displayCount); 
  }, [searchTerm, displayCount]);

  const handleScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.target;
    if (scrollHeight - scrollTop <= clientHeight + 100) {
      setDisplayCount(prev => prev + 60);
    }
  };

  return (
    <div className="glass-panel" style={{ height: '600px', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h2 style={{ margin: 0 }}>Tool Library</h2>
        <button 
          className="btn" 
          style={{ width: 'auto', padding: '0.4rem 0.6rem', fontSize: '1rem', background: 'transparent', border: '1px solid var(--glass-border)' }}
          onClick={() => setShowInfo(!showInfo)}
          title="Library Storage Info"
        >
          ℹ️ Info
        </button>
      </div>

      {showInfo && (
        <div style={{ marginBottom: '1rem', padding: '1rem', background: 'rgba(255,255,255,0.05)', borderRadius: '0.5rem', border: '1px solid var(--glass-border)', fontSize: '0.9rem' }}>
          <h3 style={{ marginTop: 0, marginBottom: '0.5rem', fontSize: '1rem' }}>Imported Libraries</h3>
          <ul style={{ paddingLeft: '1.2rem', margin: 0, color: 'var(--text-muted)' }}>
            {librarySources.map((src, i) => (
              <li key={i} style={{ marginBottom: '0.5rem' }}>
                <strong style={{ color: 'var(--text-light)' }}>{src.manufacturer}</strong> <br/>
                Date: {src.date} <br/>
                File: {src.file}
              </li>
            ))}
          </ul>
        </div>
      )}

      <input 
        type="text" 
        placeholder="Search by name, item number, or diameter..." 
        value={searchTerm}
        onChange={handleSearchChange}
        style={{ marginBottom: '1rem', flexShrink: 0 }}
      />
      <div 
        style={{ overflowY: 'auto', flex: 1, paddingRight: '0.5rem' }}
        onScroll={handleScroll}
      >
        {filteredTools.map((tool, i) => (
          <div key={i} style={{ padding: '0.75rem', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <strong style={{ display: 'block', fontSize: '0.9rem' }}>{tool.display_name}</strong>
              <small style={{ color: 'var(--text-muted)' }}>{tool.manufacturer || 'Custom'} | Dia: {tool.diameter} | Flutes: {tool.num_flutes}</small>
            </div>
            <button className="btn" style={{ padding: '0.4rem 0.8rem', width: 'auto', fontSize: '1rem' }} onClick={() => onAdd(tool)}>+</button>
          </div>
        ))}
      </div>
    </div>
  );
}
