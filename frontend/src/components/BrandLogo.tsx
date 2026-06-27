import React from 'react';
import { Plane } from 'lucide-react';

export default function BrandLogo() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 0', marginBottom: '16px' }}>
      <div style={{ 
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '40px',
        width: '40px',
        overflow: 'hidden',
        borderRadius: '8px'
      }}>
        <img src="/LOGO.png" alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <span style={{ 
          fontSize: '18px', 
          fontWeight: '800', 
          color: '#ffffff',
          letterSpacing: '0.05em',
          lineHeight: '1.2'
        }}>
          AeroAzteca
        </span>
        <span style={{ 
          fontSize: '10px', 
          fontWeight: '500', 
          color: '#94a3b8',
          letterSpacing: '0.08em',
          textTransform: 'uppercase'
        }}>
          Management System
        </span>
      </div>
    </div>
  );
}
