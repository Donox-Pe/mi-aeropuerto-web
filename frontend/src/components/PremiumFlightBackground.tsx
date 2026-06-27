import React, { useEffect, useState, useRef } from 'react';
import './PremiumFlightBackground.css';

interface RouteData {
  id: string;
  d: string;
  duration: number;
  delay: number;
  flightCode: string;
  altitude: string;
  speed: string;
}

interface AirportNode {
  code: string;
  city: string;
  x: number;
  y: number;
}

export default function PremiumFlightBackground() {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  // Seguimiento del ratón para el efecto parallax HUD
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const { clientX, clientY } = e;
      const { innerWidth, innerHeight } = window;
      const x = (clientX / innerWidth - 0.5) * 2; // -1 a 1
      const y = (clientY / innerHeight - 0.5) * 2; // -1 a 1
      setMousePos({ x, y });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Nodos de aeropuertos comerciales reales de AeroAzteca
  const airports: AirportNode[] = [
    { code: 'CUN', city: 'Cancún', x: 180, y: 390 },
    { code: 'JFK', city: 'Nueva York', x: 280, y: 200 },
    { code: 'CDG', city: 'París', x: 500, y: 150 },
    { code: 'BCN', city: 'Barcelona', x: 480, y: 250 },
    { code: 'DXB', city: 'Dubái', x: 680, y: 280 },
    { code: 'NRT', city: 'Tokio', x: 860, y: 210 },
  ];

  // Rutas aéreas curvas (Bezier) con telemetría realista e identificador de aerolínea
  const routes: RouteData[] = [
    { id: 'r-cun-jfk', d: 'M 180 390 Q 210 270 280 200', duration: 15, delay: 0, flightCode: 'AA-402', altitude: '32,000 FT', speed: '480 KTS' },
    { id: 'r-jfk-cdg', d: 'M 280 200 Q 390 90 500 150', duration: 18, delay: 3, flightCode: 'AA-910', altitude: '37,000 FT', speed: '515 KTS' },
    { id: 'r-cdg-dxb', d: 'M 500 150 Q 590 190 680 280', duration: 16, delay: 6, flightCode: 'AA-504', altitude: '35,000 FT', speed: '495 KTS' },
    { id: 'r-dxb-nrt', d: 'M 680 280 Q 770 190 860 210', duration: 20, delay: 1, flightCode: 'AA-302', altitude: '39,000 FT', speed: '530 KTS' },
    { id: 'r-bcn-cun', d: 'M 480 250 Q 330 320 180 390', duration: 22, delay: 8, flightCode: 'AA-108', altitude: '34,000 FT', speed: '470 KTS' },
    { id: 'r-nrt-jfk', d: 'M 860 210 Q 570 40 280 200', duration: 26, delay: 4, flightCode: 'AA-088', altitude: '41,000 FT', speed: '545 KTS' },
  ];

  // Path SVG de la silueta del avión comercial exacto (Boeing / Airbus con motores y alas definidas)
  // Utilizamos mejor una imagen PNG realista (A380 view from top) generada por nosotros para que los aviones se vean reales y no haya bloqueos de URL.
  const planeImageHref = "/plane-real.png";

  return (
    <div ref={containerRef} className="flight-bg-container">
      {/* HUD Grid de fondo */}
      <div className="hud-grid" />

      {/* Nebulosas/Auroras de ambientación */}
      <div className="nebula nebula-blue" />
      <div className="nebula nebula-purple" />

      {/* CAPA DE PARALAJE: Mapa HUD y Radar completo */}
      <div 
        className="flight-bg-layer layer-radar"
        style={{
          transform: `translate3d(${mousePos.x * -15}px, ${mousePos.y * -15}px, 0)`
        }}
      >
        <svg 
          viewBox="0 0 1000 600" 
          preserveAspectRatio="xMidYMid slice" 
          style={{ width: '100%', height: '100%', display: 'block' }}
        >
          <defs>
            {/* Gradiente dinámico para las estelas de ruta */}
            <linearGradient id="route-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0" />
              <stop offset="50%" stopColor="#60a5fa" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0" />
            </linearGradient>

            {/* Gradiente para el haz del radar */}
            <linearGradient id="radar-sweep" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0" />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.12" />
            </linearGradient>
          </defs>

          {/* ---- GRÁFICOS DEL RADAR HUD ---- */}
          {/* Círculos concéntricos de escaneo */}
          <g transform="translate(500, 300)" opacity="0.15">
            <circle r="450" fill="none" stroke="#60a5fa" strokeWidth="1" strokeDasharray="3 9" />
            <circle r="320" fill="none" stroke="#60a5fa" strokeWidth="1" />
            <circle r="200" fill="none" stroke="#60a5fa" strokeWidth="0.8" strokeDasharray="5 5" />
            <circle r="90" fill="none" stroke="#60a5fa" strokeWidth="0.5" />
            
            {/* Líneas en Cruz de alineación */}
            <line x1="-500" y1="0" x2="500" y2="0" stroke="#60a5fa" strokeWidth="0.5" />
            <line x1="0" y1="-300" x2="0" y2="300" stroke="#60a5fa" strokeWidth="0.5" />
          </g>

          {/* Haz de luz de escaneo del radar (Giro de 360 grados) */}
          <g className="radar-sweep-line">
            <line x1="500" y1="300" x2="950" y2="300" stroke="rgba(96, 165, 250, 0.25)" strokeWidth="1" />
            <path d="M 500 300 L 950 300 A 450 450 0 0 0 889 75 Z" fill="url(#radar-sweep)" />
          </g>

          {/* ---- RUTAS AÉREAS ---- */}
          {routes.map((route) => (
            <g key={route.id}>
              {/* Línea de ruta punteada HUD */}
              <path d={route.d} className="flight-route" />
              {/* Línea de brillo en movimiento */}
              <path d={route.d} className="flight-route-glow" />
            </g>
          ))}

          {/* ---- AVIONES Y CUADROS HUD DE TELEMETRÍA ---- */}
          {routes.map((route) => (
            <g
              key={`plane-${route.id}`}
              className="airplane-group"
              style={{
                offsetPath: `path('${route.d}')`,
                offsetRotate: 'auto',
                animation: `fly-along-route ${route.duration}s linear infinite`,
                animationDelay: `${route.delay}s`,
              }}
            >
              {/* Sombra y Silueta de Avión Comercial Realista (Imagen PNG en vez de Path) */}
              <image
                href={planeImageHref}
                x="-18"
                y="-18"
                width="36"
                height="36"
                className="flying-airplane"
                transform="rotate(90)"
              />

              {/* Caja de Datos Telemetría HUD (Fórmula 1 / Tracker militar moderno) */}
              <g transform="translate(18, -16)" className="telemetry-card">
                {/* Fondo de tarjeta */}
                <rect 
                  x="0" 
                  y="0" 
                  width="78" 
                  height="26" 
                  rx="3" 
                  className="telemetry-bg" 
                />
                
                {/* Código de vuelo */}
                <text x="5" y="8" className="telemetry-text-title">
                  {route.flightCode}
                </text>
                
                {/* Altitud */}
                <text x="5" y="16" className="telemetry-text-value">
                  ALT: {route.altitude}
                </text>
                
                {/* Velocidad */}
                <text x="5" y="23" className="telemetry-text-value-alt">
                  SPD: {route.speed}
                </text>
              </g>
            </g>
          ))}

          {/* ---- NODOS Y ETIQUETAS DE AEROPUERTOS ---- */}
          {airports.map((airport) => (
            <g key={airport.code} className="airport-node" transform={`translate(${airport.x}, ${airport.y})`}>
              {/* Círculo de pulso exterior */}
              <circle r="15" className="node-outer-glow" />
              
              {/* Punto de núcleo del aeropuerto */}
              <circle r="4.5" className="node-core" />
              
              {/* Nombre e indicador */}
              <text 
                x="9" 
                y="-4" 
                className="airport-label"
              >
                {airport.code}
                <tspan x="9" dy="12" className="airport-city">{airport.city}</tspan>
              </text>
            </g>
          ))}
        </svg>
      </div>
    </div>
  );
}
