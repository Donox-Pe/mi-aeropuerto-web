import { useTranslation } from 'react-i18next';
import { useState } from 'react';

const LANGS = [
  { code: 'es', label: 'ES', flag: '🇲🇽' },
  { code: 'en', label: 'EN', flag: '🇺🇸' },
];

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const [open, setOpen] = useState(false);

  const current = LANGS.find(l => l.code === i18n.language) ?? LANGS[0];

  function switchTo(code: string) {
    i18n.changeLanguage(code);
    setOpen(false);
  }

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <button
        onClick={() => setOpen(p => !p)}
        title="Cambiar idioma / Change language"
        style={{
          background: 'rgba(255,255,255,0.07)',
          border: '1px solid rgba(255,255,255,0.15)',
          borderRadius: 8,
          padding: '6px 10px',
          cursor: 'pointer',
          color: '#fff',
          fontSize: 13,
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: 5,
          transition: 'background 0.2s',
        }}
        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.14)')}
        onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.07)')}
      >
        <span>{current.flag}</span>
        <span>{current.label}</span>
        <span style={{ opacity: 0.6, fontSize: 10 }}>▾</span>
      </button>

      {open && (
        <div
          style={{
            position: 'absolute',
            bottom: '110%',
            left: 0,
            background: 'linear-gradient(135deg, #1a1a2e, #16213e)',
            border: '1px solid rgba(255,255,255,0.15)',
            borderRadius: 10,
            padding: '6px 0',
            minWidth: 110,
            boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
            zIndex: 9999,
          }}
        >
          {LANGS.map(lang => (
            <button
              key={lang.code}
              onClick={() => switchTo(lang.code)}
              style={{
                width: '100%',
                background: lang.code === i18n.language ? 'rgba(255,255,255,0.12)' : 'transparent',
                border: 'none',
                padding: '8px 14px',
                cursor: 'pointer',
                color: '#fff',
                textAlign: 'left',
                fontSize: 13,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                fontWeight: lang.code === i18n.language ? 700 : 400,
                transition: 'background 0.15s',
              }}
              onMouseEnter={e => { if (lang.code !== i18n.language) e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; }}
              onMouseLeave={e => { if (lang.code !== i18n.language) e.currentTarget.style.background = 'transparent'; }}
            >
              <span>{lang.flag}</span>
              <span>{lang.label}</span>
              {lang.code === i18n.language && <span style={{ marginLeft: 'auto', color: '#10b981', fontSize: 12 }}>✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
