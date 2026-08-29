interface PjkLogoProps {
  size?: number;
  color?: string;
  className?: string;
}

/**
 * Recreated (not a pixel copy) from a supplied reference image: a broken
 * ring, a barbell crossing through it, and a "PJK" wordmark. Colors are
 * passed in so it can sit on either a light or dark ground.
 */
export default function PjkLogo({ size = 140, color = "#FBFAF6", className }: PjkLogoProps) {
  return (
    <svg viewBox="0 0 200 200" width={size} height={size} className={className} role="img" aria-label="PJK">
      <path
        d="M 100 24 A 76 76 0 1 1 32 130"
        fill="none"
        stroke={color}
        strokeWidth={9}
        strokeLinecap="round"
      />
      <g stroke={color} strokeLinecap="round">
        <line x1="8" y1="100" x2="192" y2="100" strokeWidth={5} />
        <line x1="20" y1="82" x2="20" y2="118" strokeWidth={9} />
        <line x1="30" y1="76" x2="30" y2="124" strokeWidth={9} />
        <line x1="170" y1="80" x2="170" y2="120" strokeWidth={9} />
        <line x1="180" y1="86" x2="180" y2="114" strokeWidth={9} />
      </g>
      <text
        x="100"
        y="112"
        textAnchor="middle"
        fontFamily="Georgia, 'Times New Roman', serif"
        fontWeight={700}
        fontSize={58}
        fill={color}
        stroke={color}
        strokeWidth={1}
      >
        PJK
      </text>
    </svg>
  );
}
