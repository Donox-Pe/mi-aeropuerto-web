import { useEffect, useRef } from 'react';

export default function CursorGlow() {
  const glowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const glow = glowRef.current;
    if (!glow) return;

    let animFrame = 0;
    let targetX = 0;
    let targetY = 0;
    let currentX = 0;
    let currentY = 0;

    const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

    const animate = () => {
      currentX = lerp(currentX, targetX, 0.15);
      currentY = lerp(currentY, targetY, 0.15);
      glow.style.transform = `translate(${currentX - 200}px, ${currentY - 200}px)`;
      animFrame = requestAnimationFrame(animate);
    };

    const onMove = (e: MouseEvent) => {
      targetX = e.clientX;
      targetY = e.clientY;
      glow.style.opacity = '1';
    };

    const onLeave = () => {
      glow.style.opacity = '0';
    };

    const onEnter = () => {
      glow.style.opacity = '1';
    };

    window.addEventListener('mousemove', onMove);
    document.addEventListener('mouseleave', onLeave);
    document.addEventListener('mouseenter', onEnter);
    animFrame = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseleave', onLeave);
      document.removeEventListener('mouseenter', onEnter);
      cancelAnimationFrame(animFrame);
    };
  }, []);

  return (
    <div
      ref={glowRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: 400,
        height: 400,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(59,130,246,0.08) 0%, rgba(59,130,246,0.03) 40%, transparent 70%)',
        pointerEvents: 'none',
        zIndex: 9999,
        opacity: 0,
        transition: 'opacity 0.4s ease',
        willChange: 'transform',
      }}
    />
  );
}
