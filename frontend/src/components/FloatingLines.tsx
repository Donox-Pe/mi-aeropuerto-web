import React, { useRef, useEffect } from 'react';
import './FloatingLines.css';

type WaveId = 'top' | 'middle' | 'bottom';

interface FloatingLinesProps {
  enabledWaves?: WaveId[];
  lineCount?: [number, number, number];
  lineDistance?: [number, number, number];
  bendRadius?: number;
  bendStrength?: number;
  interactive?: boolean;
  parallax?: boolean;
}

const DEFAULT_LINES: [number, number, number] = [10, 15, 20];
const DEFAULT_DISTANCE: [number, number, number] = [10, 8, 6];

const FloatingLines: React.FC<FloatingLinesProps> = ({
  enabledWaves = ['top', 'middle', 'bottom'],
  lineCount = DEFAULT_LINES,
  lineDistance = DEFAULT_DISTANCE,
  bendRadius = 6.0,
  bendStrength = -0.6,
  interactive = true,
  parallax = true,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!interactive) return;
    const container = containerRef.current;
    if (!container) return;

    const handleMouseMove = (event: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - 0.5;
      const y = (event.clientY - rect.top) / rect.height - 0.5;

      if (parallax) {
        container.style.setProperty('--mouse-x', x.toString());
        container.style.setProperty('--mouse-y', y.toString());
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [interactive, parallax]);

  const renderLines = (wave: WaveId, index: number) => {
    const count = lineCount[index];
    const distance = lineDistance[index];
    return Array.from({ length: count }).map((_, i) => (
      <div
        key={`${wave}-${i}`}
        className={`floating-line floating-line-${wave}`}
        style={{
          top: `${i * distance}px`,
          ['--bend-radius' as any]: bendRadius,
          ['--bend-strength' as any]: bendStrength,
        }}
      />
    ));
  };

  return (
    <div ref={containerRef} className="floating-lines-container">
      {enabledWaves.includes('top') && (
        <div className="floating-lines-wave wave-top">
          {renderLines('top', 0)}
        </div>
      )}
      {enabledWaves.includes('middle') && (
        <div className="floating-lines-wave wave-middle">
          {renderLines('middle', 1)}
        </div>
      )}
      {enabledWaves.includes('bottom') && (
        <div className="floating-lines-wave wave-bottom">
          {renderLines('bottom', 2)}
        </div>
      )}
    </div>
  );
};

export default FloatingLines;


