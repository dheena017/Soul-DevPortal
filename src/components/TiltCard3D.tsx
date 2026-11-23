import React, { useRef, useState, useCallback } from 'react';

export interface TiltCard3DProps extends React.HTMLAttributes<HTMLDivElement> {
  key?: React.Key;
  children: React.ReactNode;
  className?: string;
  maxTilt?: number; // max tilt in degrees (default 6 for subtle, clean feel)
  scale?: number; // scale on hover (default 1.01)
  glare?: boolean;
  glareOpacity?: number;
}

export default function TiltCard3D({
  children,
  className = '',
  maxTilt = 6,
  scale = 1.012,
  glare = true,
  glareOpacity = 0.12,
  ...rest
}: TiltCard3DProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [style, setStyle] = useState<React.CSSProperties>({});
  const [glareStyle, setGlareStyle] = useState<React.CSSProperties>({ opacity: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!cardRef.current) return;
      const rect = cardRef.current.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;

      const tiltX = (y - 0.5) * -maxTilt * 2;
      const tiltY = (x - 0.5) * maxTilt * 2;

      setStyle({
        transform: `perspective(1000px) rotateX(${tiltX.toFixed(2)}deg) rotateY(${tiltY.toFixed(2)}deg) scale3d(${scale}, ${scale}, ${scale})`,
        transition: 'transform 0.08s ease-out',
      });

      if (glare) {
        setGlareStyle({
          opacity: glareOpacity,
          background: `radial-gradient(circle at ${x * 100}% ${y * 100}%, rgba(59, 130, 246, 0.4) 0%, rgba(37, 99, 235, 0.15) 35%, transparent 65%)`,
          transition: 'opacity 0.15s ease-out',
        });
      }
    },
    [maxTilt, scale, glare, glareOpacity]
  );

  const handleMouseEnter = useCallback(() => {
    setIsHovered(true);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
    setStyle({
      transform: 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)',
      transition: 'transform 0.4s cubic-bezier(0.2, 0.8, 0.2, 1)',
    });
    if (glare) {
      setGlareStyle({
        opacity: 0,
        transition: 'opacity 0.3s ease-out',
      });
    }
  }, [glare]);

  return (
    <div
      ref={cardRef}
      className={`relative will-change-transform ${className}`}
      style={{
        transformStyle: 'preserve-3d',
        ...style,
      }}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      {...rest}
    >
      {children}

      {glare && isHovered && (
        <div
          className="pointer-events-none absolute inset-0 rounded-2xl z-20 overflow-hidden mix-blend-screen"
          style={glareStyle}
          aria-hidden="true"
        />
      )}
    </div>
  );
}
