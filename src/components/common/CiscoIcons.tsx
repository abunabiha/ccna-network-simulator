import React from 'react';

interface IconProps {
  className?: string;
  size?: number;
}

/**
 * Ikon Cisco Router Standar Industri
 * Silinder biru dengan 4 panah silang (2 masuk, 2 keluar)
 */
export const CiscoRouterIcon: React.FC<IconProps> = ({ className = "w-10 h-10", size }) => (
  <svg
    viewBox="0 0 64 64"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    style={size ? { width: size, height: size } : undefined}
  >
    {/* Base Cylinder Body */}
    <ellipse cx="32" cy="48" rx="26" ry="10" fill="#005073" stroke="#049fd9" strokeWidth="2.5" />
    <path d="M6 24V48C6 53.5 17.6 58 32 58C46.4 58 58 53.5 58 48V24" fill="#005073" stroke="#049fd9" strokeWidth="2.5" />
    <ellipse cx="32" cy="24" rx="26" ry="10" fill="#049fd9" stroke="#38bdf8" strokeWidth="2.5" />

    {/* Cisco 4-Way Cross Arrows on Top Disk */}
    {/* Arrow 1: Top-Left pointing IN */}
    <path d="M19 16L27 21M27 21V16M27 21H22" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    {/* Arrow 2: Bottom-Right pointing IN */}
    <path d="M45 32L37 27M37 27V32M37 27H42" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    {/* Arrow 3: Top-Right pointing OUT */}
    <path d="M37 21L45 16M45 16H40M45 16V21" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    {/* Arrow 4: Bottom-Left pointing OUT */}
    <path d="M27 27L19 32M19 32H24M19 32V27" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/**
 * Ikon Cisco Catalyst Layer 2 Switch Standar Industri
 * Balok dengan 4 panah horizontal berlawanan (2 ke kiri, 2 ke kanan)
 */
export const CiscoSwitchIcon: React.FC<IconProps> = ({ className = "w-10 h-10", size }) => (
  <svg
    viewBox="0 0 64 64"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    style={size ? { width: size, height: size } : undefined}
  >
    {/* 3D Switch Box */}
    <path d="M8 26L20 14H56L44 26H8Z" fill="#006272" stroke="#00b4d8" strokeWidth="2" />
    <path d="M56 14V36L44 48V26L56 14Z" fill="#004c59" stroke="#00b4d8" strokeWidth="2" />
    <rect x="8" y="26" width="36" height="22" rx="2" fill="#028090" stroke="#00b4d8" strokeWidth="2" />

    {/* Cisco 4-Way Horizontal Arrows */}
    {/* Arrow Left Top */}
    <path d="M34 32H16M16 32L20 29M16 32L20 35" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    {/* Arrow Right Top */}
    <path d="M18 38H36M36 38L32 35M36 38L32 41" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    {/* Top Plate Arrows */}
    <path d="M22 20H42M42 20L38 18M42 20L38 22" stroke="#ffffff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/**
 * Ikon Cisco Catalyst Multilayer (Layer 3) Switch Standar Industri
 * Kubus dengan panah 4 arah silang di atas permukaan
 */
export const CiscoL3SwitchIcon: React.FC<IconProps> = ({ className = "w-10 h-10", size }) => (
  <svg
    viewBox="0 0 64 64"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    style={size ? { width: size, height: size } : undefined}
  >
    {/* 3D Multilayer Switch Box */}
    <path d="M8 24L22 12H56L42 24H8Z" fill="#312e81" stroke="#6366f1" strokeWidth="2" />
    <path d="M56 12V38L42 50V24L56 12Z" fill="#1e1b4b" stroke="#6366f1" strokeWidth="2" />
    <rect x="8" y="24" width="34" height="26" rx="2" fill="#4338ca" stroke="#6366f1" strokeWidth="2" />

    {/* Layer 3 Routing & Switching Crossed Arrows on Top */}
    <path d="M22 18L42 18M42 18L38 15M42 18L38 21" stroke="#ffffff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    {/* Vertical & Diagonal Cross Arrows */}
    <path d="M25 32V44M25 44L21 40M25 44L29 40" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M17 38H33M33 38L29 35M33 38L29 41" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/**
 * Ikon PC Desktop Komputer Standar Cisco
 * Monitor CRT/LCD dan Desktop Tower Unit
 */
export const CiscoPcIcon: React.FC<IconProps> = ({ className = "w-10 h-10", size }) => (
  <svg
    viewBox="0 0 64 64"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    style={size ? { width: size, height: size } : undefined}
  >
    {/* Desktop Monitor Screen */}
    <rect x="10" y="12" width="44" height="30" rx="3" fill="#0f172a" stroke="#0284c7" strokeWidth="2.5" />
    {/* Display Area */}
    <rect x="15" y="16" width="34" height="22" rx="1" fill="#0369a1" />
    {/* Terminal prompt symbol on screen */}
    <path d="M19 23L23 27L19 31M25 31H29" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    {/* Stand & Base */}
    <path d="M28 42H36V48H28V42Z" fill="#334155" stroke="#0284c7" strokeWidth="2" />
    <rect x="22" y="48" width="20" height="4" rx="1.5" fill="#475569" stroke="#0284c7" strokeWidth="1.5" />
  </svg>
);

/**
 * Ikon Server Standar Cisco
 * Rak server dengan drive bays dan LED status
 */
export const CiscoServerIcon: React.FC<IconProps> = ({ className = "w-10 h-10", size }) => (
  <svg
    viewBox="0 0 64 64"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    style={size ? { width: size, height: size } : undefined}
  >
    {/* Server Tower / Rack Case */}
    <rect x="14" y="10" width="36" height="46" rx="3" fill="#1e1b4b" stroke="#8b5cf6" strokeWidth="2.5" />
    {/* Drive Bay 1 */}
    <rect x="18" y="16" width="28" height="6" rx="1.5" fill="#312e81" stroke="#7c3aed" strokeWidth="1.5" />
    <circle cx="41" cy="19" r="1.5" fill="#10b981" />
    {/* Drive Bay 2 */}
    <rect x="18" y="26" width="28" height="6" rx="1.5" fill="#312e81" stroke="#7c3aed" strokeWidth="1.5" />
    <circle cx="41" cy="29" r="1.5" fill="#10b981" />
    {/* Drive Bay 3 */}
    <rect x="18" y="36" width="28" height="6" rx="1.5" fill="#312e81" stroke="#7c3aed" strokeWidth="1.5" />
    <circle cx="41" cy="39" r="1.5" fill="#38bdf8" />
    {/* Ventilation Grille / Power */}
    <line x1="20" y1="48" x2="34" y2="48" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round" />
    <circle cx="41" cy="48" r="2" fill="#ef4444" />
  </svg>
);

/**
 * Ikon Cloud / Internet Standar Cisco
 */
export const CiscoCloudIcon: React.FC<IconProps> = ({ className = "w-10 h-10", size }) => (
  <svg
    viewBox="0 0 64 64"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    style={size ? { width: size, height: size } : undefined}
  >
    <path
      d="M18 44H46C51.5 44 56 39.5 56 34C56 28.8 52 24.5 47 24.1C45.5 17.2 39.4 12 32 12C23.7 12 17 18 16.2 26C11 26.8 7 31.3 7 36.8C7 40.8 11.9 44 18 44Z"
      fill="#0c4a6e"
      stroke="#0284c7"
      strokeWidth="2.5"
    />
    <text x="32" y="33" textAnchor="middle" fill="#38bdf8" fontSize="10" fontWeight="bold" fontFamily="sans-serif">
      WAN
    </text>
  </svg>
);

/**
 * Ikon Firewall Standar Cisco
 */
export const CiscoFirewallIcon: React.FC<IconProps> = ({ className = "w-10 h-10", size }) => (
  <svg
    viewBox="0 0 64 64"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    style={size ? { width: size, height: size } : undefined}
  >
    {/* Brick Wall Rectangle */}
    <rect x="10" y="14" width="44" height="38" rx="2" fill="#881337" stroke="#f43f5e" strokeWidth="2.5" />
    {/* Mortar Lines / Bricks */}
    <line x1="10" y1="26" x2="54" y2="26" stroke="#fb7185" strokeWidth="1.8" />
    <line x1="10" y1="38" x2="54" y2="38" stroke="#fb7185" strokeWidth="1.8" />
    <line x1="25" y1="14" x2="25" y2="26" stroke="#fb7185" strokeWidth="1.8" />
    <line x1="40" y1="14" x2="40" y2="26" stroke="#fb7185" strokeWidth="1.8" />
    <line x1="18" y1="26" x2="18" y2="38" stroke="#fb7185" strokeWidth="1.8" />
    <line x1="33" y1="26" x2="33" y2="38" stroke="#fb7185" strokeWidth="1.8" />
    <line x1="47" y1="26" x2="47" y2="38" stroke="#fb7185" strokeWidth="1.8" />
    <line x1="25" y1="38" x2="25" y2="52" stroke="#fb7185" strokeWidth="1.8" />
    <line x1="40" y1="38" x2="40" y2="52" stroke="#fb7185" strokeWidth="1.8" />
  </svg>
);
