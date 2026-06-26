import React from 'react';
import { Plane } from 'lucide-react';

export default function BrandLogo() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 0', marginBottom: '16px' }}>
      <div style={{ 
        background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
        borderRadius: '10px',
        padding: '8px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 4px 15px rgba(59, 130, 246, 0.4)'
      }}>
        <Plane color="white" size={22} style={{ transform: 'rotate(45deg)' }} />
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
