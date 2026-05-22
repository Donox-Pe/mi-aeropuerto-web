import { useTheme } from '../context/ThemeContext';

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button 
      onClick={toggleTheme}
      style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        zIndex: 9999,
        background: 'var(--card)',
        color: 'var(--text)',
        border: '1px solid var(--border)',
        borderRadius: '50%',
        width: '44px',
        height: '44px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
        fontSize: '20px'
      }}
      title="Alternar Modo Oscuro"
    >
      {theme === 'dark' ? '☀️' : '🌙'}
    </button>
  );
}
