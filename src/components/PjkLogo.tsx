interface PjkLogoProps {
  size?: number;
  color?: string;
  className?: string;
}

/** Simple dumbbell mark for the welcome screen. */
export default function PjkLogo({ size = 140, color = "#FBFAF6", className }: PjkLogoProps) {
  return (
    <svg viewBox="0 0 200 200" width={size} height={size} className={className} role="img" aria-label="Dumbbell">
      <g fill={color}>
        <rect x="70" y="92" width="60" height="16" rx="8" />
        <rect x="38" y="70" width="24" height="60" rx="8" />
        <rect x="24" y="82" width="14" height="36" rx="6" />
        <rect x="138" y="70" width="24" height="60" rx="8" />
        <rect x="162" y="82" width="14" height="36" rx="6" />
      </g>
    </svg>
  );
}
