import React from 'react';

export default function ExportCart({ items, onRemove, onExport }) {
  return (
    <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', height: '600px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h2 style={{ margin: 0 }}>Export Queue</h2>
        <span style={{ background: 'var(--primary)', color: 'white', padding: '0.2rem 0.6rem', borderRadius: '1rem', fontSize: '0.8rem', fontWeight: 'bold' }}>{items.length}</span>
      </div>
      
      <div style={{ overflowY: 'auto', flex: 1, marginBottom: '1rem' }}>
        {items.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', fontStyle: 'italic', textAlign: 'center', marginTop: '2rem' }}>No tools added yet.</p>
        ) : (
          items.map(item => {
            const units = (item.geometryUnits || item.geometry_units) === '1' || (item.geometryUnits || item.geometry_units) === 1 ? 'mm' : 'in';
            const displayName = item.display_name || `Custom Tool - ${item.diameter}${units}`;
            return (
              <div key={item.cartId} style={{ padding: '0.75rem', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.9rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '80%' }}>{displayName}</span>
                <button 
                  onClick={() => onRemove(item.cartId)} 
                  style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '1.2rem', padding: '0 0.5rem'}}
                >
                  &times;
                </button>
              </div>
            );
          })
        )}
      </div>
      
      <button 
        className="btn" 
        onClick={onExport} 
        disabled={items.length === 0}
        style={{ opacity: items.length === 0 ? 0.5 : 1 }}
      >
        Export {items.length} Tools (.vtdb)
      </button>
    </div>
  );
}
