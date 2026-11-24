import React from 'react';

export interface SoulLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'icon' | 'full' | 'badge';
  className?: string;
  showSubtitle?: boolean;
}

const SIZE_MAP = {
  xs: { box: 'w-5 h-5', icon: 20, text: 'text-xs', sub: 'text-[8px]' },
  sm: { box: 'w-6 h-6', icon: 24, text: 'text-xs', sub: 'text-[9px]' },
  md: { box: 'w-8 h-8', icon: 32, text: 'text-sm', sub: 'text-[10px]' },
  lg: { box: 'w-10 h-10', icon: 40, text: 'text-base', sub: 'text-[11px]' },
  xl: { box: 'w-14 h-14', icon: 56, text: 'text-xl', sub: 'text-xs' },
};

/**
 * SoulLogoIcon — The canonical vector emblem of Soul Workspace.
 * A precision-crafted geometric "S" ribbon featuring dual interlocking
 * radiant energy arcs, an electric gradient, and an optical glow core.
 */
export const SoulLogoIcon: React.FC<{ size?: number; className?: string }> = ({
  size = 32,
  className = '',
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 ${className}`}
      aria-hidden="true"
    >
      <defs>
        {/* Primary Radiant Neon Gradient: Cyan -> Electric Indigo -> Violet */}
        <linearGradient id="soul-neon-1" x1="8" y1="8" x2="56" y2="56" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#38bdf8" />
          <stop offset="50%" stopColor="#6366f1" />
          <stop offset="100%" stopColor="#a855f7" />
        </linearGradient>

        {/* Secondary Ribbon Gradient: Azure -> Teal */}
        <linearGradient id="soul-neon-2" x1="56" y1="12" x2="8" y2="52" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#38bdf8" />
          <stop offset="50%" stopColor="#818cf8" />
          <stop offset="100%" stopColor="#2dd4bf" />
        </linearGradient>

        {/* Ambient Glow Gradient */}
        <radialGradient id="soul-ambient" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#6366f1" stopOpacity="0.3" />
          <stop offset="70%" stopColor="#38bdf8" stopOpacity="0.08" />
          <stop offset="100%" stopColor="#070708" stopOpacity="0" />
        </radialGradient>

        {/* Subtle Inner Glass Surface */}
        <linearGradient id="soul-glass" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#151519" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#070708" stopOpacity="0.95" />
        </linearGradient>

        {/* Glow Filter */}
        <filter id="soul-core-glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="2.5" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* Ambient background glow circle */}
      <circle cx="32" cy="32" r="24" fill="url(#soul-ambient)" />

      {/* Outer Hex-Squircle Shield */}
      <rect
        x="2"
        y="2"
        width="60"
        height="60"
        rx="16"
        fill="url(#soul-glass)"
        stroke="url(#soul-neon-1)"
        strokeWidth="1.5"
        strokeOpacity="0.35"
      />

      {/* Top Arc of Soul 'S' */}
      <path
        d="M20 22C20 16.4772 24.4772 12 30 12H41C43.7614 12 46 14.2386 46 17C46 19.7614 43.7614 22 41 22H29C26.7909 22 25 23.7909 25 26C25 28.2091 26.7909 30 29 30H38C44.6274 30 50 35.3726 50 42C50 48.6274 44.6274 54 38 54H25C22.2386 54 20 51.7614 20 49C20 46.2386 22.2386 44 25 44H38C40.2091 44 42 42.2091 42 40C42 37.7909 40.2091 36 38 36H29C22.3726 36 17 30.6274 17 24C17 19.5 19.5 15.5 23.5 13.5"
        stroke="url(#soul-neon-1)"
        strokeWidth="4.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        filter="url(#soul-core-glow)"
      />

      {/* Accent Inner Core Sparks */}
      <circle cx="41" cy="17" r="2.5" fill="#38bdf8" />
      <circle cx="25" cy="49" r="2.5" fill="#a855f7" />
      
      {/* Central Nexus Anchor Node */}
      <circle cx="33.5" cy="33" r="3" fill="#ffffff" opacity="0.9" />
      <circle cx="33.5" cy="33" r="5" stroke="url(#soul-neon-2)" strokeWidth="1" opacity="0.5" />
    </svg>
  );
};

export const SoulLogo: React.FC<SoulLogoProps> = ({
  size = 'md',
  variant = 'full',
  className = '',
  showSubtitle = true,
}) => {
  const config = SIZE_MAP[size];

  if (variant === 'icon') {
    return <SoulLogoIcon size={config.icon} className={className} />;
  }

  return (
    <div className={`inline-flex items-center gap-2.5 group select-none ${className}`}>
      <div className="relative flex items-center justify-center transition-transform duration-200 group-hover:scale-105">
        <SoulLogoIcon size={config.icon} />
      </div>

      {variant === 'full' && (
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-1.5 leading-none">
            <span className={`font-extrabold tracking-tight text-white ${config.text}`}>
              Soul
            </span>
            <span className={`font-semibold text-transparent bg-clip-text bg-gradient-to-r from-sky-400 via-indigo-400 to-purple-400 ${config.text}`}>
              DevPortal
            </span>
          </div>
          {showSubtitle && (
            <span className={`font-mono font-bold tracking-widest text-neutral-400 uppercase mt-0.5 ${config.sub}`}>
              WORKSPACE ARCHITECTURE
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default SoulLogo;
