interface PjkLogoProps {
  size?: number;
  color?: string;
  /** Color behind the wordmark, used to knock the barbell out from behind
   * the letters. Should match whatever this sits on. */
  bg?: string;
  className?: string;
}

/**
 * Recreated (not a pixel copy) from a supplied reference image: a full
 * ring, a barbell crossing through it, and a "PJK" wordmark sitting in
 * front of the bar. Colors are passed in so it can sit on either a light
 * or dark ground.
 */
export default function PjkLogo({ size = 140, color = "#FBFAF6", bg = "#0E2A4C", className }: PjkLogoProps) {
  return (
    <svg viewBox="0 0 200 200" width={size} height={size} className={className} role="img" aria-label="PJK">
      <circle cx="100" cy="100" r="76" fill="none" stroke={color} strokeWidth={9} />
      <g stroke={color} strokeLinecap="round">
        <line x1="8" y1="100" x2="192" y2="100" strokeWidth={5} />
        <line x1="20" y1="82" x2="20" y2="118" strokeWidth={9} />
        <line x1="30" y1="76" x2="30" y2="124" strokeWidth={9} />
        <line x1="170" y1="80" x2="170" y2="120" strokeWidth={9} />
        <line x1="180" y1="86" x2="180" y2="114" strokeWidth={9} />
      </g>
      {/* Knock the wordmark's silhouette out of the barbell before drawing
          the crisp letters on top, so the bar reads as passing behind them. */}
      <text
        x="100"
        y="112"
        textAnchor="middle"
        fontFamily="Georgia, 'Times New Roman', serif"
        fontWeight={700}
        fontSize={58}
        fill={bg}
        stroke={bg}
        strokeWidth={10}
        strokeLinejoin="round"
      >
        PJK
      </text>
      <text
        x="100"
        y="112"
        textAnchor="middle"
        fontFamily="Georgia, 'Times New Roman', serif"
        fontWeight={700}
        fontSize={58}
        fill={color}
      >
        PJK
      </text>
    </svg>
  );
}
