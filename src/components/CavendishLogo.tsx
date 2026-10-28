import React from 'react';

interface CavendishLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'full' | 'crest' | 'horizontal' | 'badge';
  themeOverride?: 'light' | 'dark';
  className?: string;
  showMotto?: boolean;
}

export const CavendishLogo: React.FC<CavendishLogoProps> = ({
  size = 'md',
  variant = 'horizontal',
  themeOverride,
  className = '',
  showMotto = true,
}) => {
  // Dimensions for the crest SVG
  const crestSizes = {
    xs: { width: 28, height: 28 },
    sm: { width: 36, height: 36 },
    md: { width: 48, height: 48 },
    lg: { width: 68, height: 68 },
    xl: { width: 92, height: 92 },
  };

  const { width, height } = crestSizes[size] || crestSizes.md;

  // The official Cavendish University Zambia Heraldic Crest SVG
  const CrestSVG = (
    <svg
      width={width}
      height={height}
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="shrink-0 transition-transform duration-300 drop-shadow-md"
    >
      <defs>
        {/* Navy Gradient for shield field */}
        <linearGradient id="cuzNavyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0B1B3D" />
          <stop offset="50%" stopColor="#00205B" />
          <stop offset="100%" stopColor="#071329" />
        </linearGradient>

        {/* Gold metallic gradient for accents & laurel */}
        <linearGradient id="cuzGoldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FDE68A" />
          <stop offset="35%" stopColor="#F59E0B" />
          <stop offset="70%" stopColor="#D97706" />
          <stop offset="100%" stopColor="#B45309" />
        </linearGradient>

        {/* Silver/Ice gradient */}
        <linearGradient id="cuzSilverGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#E2E8F0" />
        </linearGradient>

        {/* Soft shadow for shield */}
        <filter id="cuzShieldShadow" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="2" stdDeviation="2" floodOpacity="0.25" floodColor="#000000" />
        </filter>
      </defs>

      {/* Outer Golden Laurel Wreath (Heraldic Academic Honor) */}
      <g stroke="url(#cuzGoldGrad)" strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.95">
        {/* Left Laurel Branch */}
        <path d="M 28 85 C 16 65 18 38 34 22" />
        {/* Left Leaves */}
        <ellipse cx="23" cy="74" rx="4" ry="2.2" transform="rotate(-35 23 74)" fill="url(#cuzGoldGrad)" />
        <ellipse cx="19" cy="62" rx="4.2" ry="2.3" transform="rotate(-20 19 62)" fill="url(#cuzGoldGrad)" />
        <ellipse cx="19" cy="49" rx="4.2" ry="2.3" transform="rotate(5 19 49)" fill="url(#cuzGoldGrad)" />
        <ellipse cx="23" cy="36" rx="4" ry="2.2" transform="rotate(25 23 36)" fill="url(#cuzGoldGrad)" />
        <ellipse cx="30" cy="26" rx="3.8" ry="2" transform="rotate(45 30 26)" fill="url(#cuzGoldGrad)" />

        {/* Right Laurel Branch */}
        <path d="M 92 85 C 104 65 102 38 86 22" />
        {/* Right Leaves */}
        <ellipse cx="97" cy="74" rx="4" ry="2.2" transform="rotate(35 97 74)" fill="url(#cuzGoldGrad)" />
        <ellipse cx="101" cy="62" rx="4.2" ry="2.3" transform="rotate(20 101 62)" fill="url(#cuzGoldGrad)" />
        <ellipse cx="101" cy="49" rx="4.2" ry="2.3" transform="rotate(-5 101 49)" fill="url(#cuzGoldGrad)" />
        <ellipse cx="97" cy="36" rx="4" ry="2.2" transform="rotate(-25 97 36)" fill="url(#cuzGoldGrad)" />
        <ellipse cx="90" cy="26" rx="3.8" ry="2" transform="rotate(-45 90 26)" fill="url(#cuzGoldGrad)" />
      </g>

      {/* Main Heraldic Shield (Escutcheon) */}
      <g filter="url(#cuzShieldShadow)">
        {/* Outer Shield Gold Rim */}
        <path
          d="M 60 14 C 78 14 86 20 86 26 C 86 58 76 82 60 96 C 44 82 34 58 34 26 C 34 20 42 14 60 14 Z"
          fill="url(#cuzNavyGrad)"
          stroke="url(#cuzGoldGrad)"
          strokeWidth="3.2"
        />
        {/* Inner Thin White Border Accent */}
        <path
          d="M 60 18 C 75 18 82 23 82 28 C 82 55 73 77 60 90 C 47 77 38 55 38 28 C 38 23 45 18 60 18 Z"
          fill="none"
          stroke="#FFFFFF"
          strokeWidth="0.9"
          strokeOpacity="0.4"
        />
      </g>

      {/* Radiant Star of Knowledge & Truth at Top of Shield */}
      <g transform="translate(60, 31)">
        {/* Golden 8-point academic star */}
        <polygon
          points="0,-7 2,-2 7,0 2,2 0,7 -2,2 -7,0 -2,-2"
          fill="url(#cuzGoldGrad)"
        />
        <circle cx="0" cy="0" r="1.5" fill="#FFFFFF" />
      </g>

      {/* Open Book of Wisdom & Science (Centerpiece) */}
      <g transform="translate(60, 52)">
        {/* Left Book Page */}
        <path
          d="M -1 -3 C -7 -6 -17 -4 -18 7 C -11 5 -4 6 -1 10 Z"
          fill="url(#cuzSilverGrad)"
          stroke="#00205B"
          strokeWidth="0.8"
        />
        {/* Right Book Page */}
        <path
          d="M 1 -3 C 7 -6 17 -4 18 7 C 11 5 4 6 1 10 Z"
          fill="url(#cuzSilverGrad)"
          stroke="#00205B"
          strokeWidth="0.8"
        />
        {/* Book Spine / Binding */}
        <path d="M 0 -2 L 0 11" stroke="url(#cuzGoldGrad)" strokeWidth="1.5" strokeLinecap="round" />
        {/* Text lines in book (left page) */}
        <line x1="-14" y1="1" x2="-4" y2="0" stroke="#00205B" strokeWidth="0.8" strokeLinecap="round" opacity="0.6" />
        <line x1="-15" y1="4" x2="-4" y2="3.5" stroke="#00205B" strokeWidth="0.8" strokeLinecap="round" opacity="0.6" />
        <line x1="-13" y1="7" x2="-4" y2="7" stroke="#00205B" strokeWidth="0.8" strokeLinecap="round" opacity="0.6" />
        {/* Text lines in book (right page) */}
        <line x1="4" y1="0" x2="14" y2="1" stroke="#00205B" strokeWidth="0.8" strokeLinecap="round" opacity="0.6" />
        <line x1="4" y1="3.5" x2="15" y2="4" stroke="#00205B" strokeWidth="0.8" strokeLinecap="round" opacity="0.6" />
        <line x1="4" y1="7" x2="13" y2="7" stroke="#00205B" strokeWidth="0.8" strokeLinecap="round" opacity="0.6" />
      </g>

      {/* Lab & Tech Atom / Science Nodes at Lower Shield */}
      <g transform="translate(60, 75)">
        <ellipse cx="0" cy="0" rx="9" ry="3.5" transform="rotate(-25)" stroke="url(#cuzGoldGrad)" strokeWidth="0.9" fill="none" opacity="0.85" />
        <ellipse cx="0" cy="0" rx="9" ry="3.5" transform="rotate(25)" stroke="url(#cuzGoldGrad)" strokeWidth="0.9" fill="none" opacity="0.85" />
        <circle cx="0" cy="0" r="1.8" fill="#FFFFFF" />
      </g>

      {/* Lower University Ribbon / Scroll */}
      <g filter="url(#cuzShieldShadow)">
        {/* Ribbon banner background */}
        <path
          d="M 18 97 L 30 92 L 30 102 L 18 107 Z"
          fill="#00205B"
          stroke="url(#cuzGoldGrad)"
          strokeWidth="0.8"
        />
        <path
          d="M 102 97 L 90 92 L 90 102 L 102 107 Z"
          fill="#00205B"
          stroke="url(#cuzGoldGrad)"
          strokeWidth="0.8"
        />
        <path
          d="M 26 95 C 44 91 76 91 94 95 L 91 106 C 74 102 46 102 29 106 Z"
          fill="url(#cuzGoldGrad)"
          stroke="#B45309"
          strokeWidth="0.9"
        />
        {/* Ribbon text */}
        <text
          x="60"
          y="102"
          textAnchor="middle"
          fontSize="5.2"
          fontWeight="900"
          fontFamily="system-ui, -apple-system, sans-serif"
          fill="#00205B"
          letterSpacing="0.4"
        >
          CAVENDISH • CUZ
        </text>
      </g>
    </svg>
  );

  if (variant === 'crest') {
    return (
      <div className={`inline-flex items-center justify-center ${className}`}>
        {CrestSVG}
      </div>
    );
  }

  if (variant === 'badge') {
    return (
      <div className={`inline-flex items-center gap-2.5 px-3 py-1.5 rounded-2xl bg-white dark:bg-[#0c182e] border border-blue-200 dark:border-blue-900/60 shadow-xs ${className}`}>
        {CrestSVG}
        <div className="leading-tight">
          <div className="font-black text-xs tracking-wider text-[#00205B] dark:text-blue-200">
            CAVENDISH UNIVERSITY
          </div>
          <div className="text-[10px] font-semibold text-amber-600 dark:text-amber-400">
            Zambia • Lab System
          </div>
        </div>
      </div>
    );
  }

  // Full / Horizontal Variant (Default for Navigation and Headers)
  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      {CrestSVG}

      <div className="flex flex-col justify-center leading-none">
        <div className="flex items-center gap-1.5 mb-0.5">
          <span className="font-black text-lg sm:text-xl tracking-tight text-[#00205B] dark:text-white uppercase font-sans">
            CAVENDISH
          </span>
          <span className="px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-[#00205B] dark:bg-amber-400 text-white dark:text-[#00205B] tracking-wider">
            ZAMBIA
          </span>
        </div>

        <div className="text-[11px] sm:text-xs font-semibold tracking-wide text-blue-900/80 dark:text-blue-200">
          School of Science & Technology • Lab System
        </div>

        {showMotto && (
          <div className="text-[10px] font-medium italic text-amber-600 dark:text-amber-300 mt-0.5 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block" />
            Success Begins at Cavendish
          </div>
        )}
      </div>
    </div>
  );
};
