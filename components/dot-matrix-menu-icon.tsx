// On-brand menu glyph: a 3×3 dot-matrix that morphs into a five-dot X when
// the menu is open. The grid uses the same dot vocabulary as
// `dot-matrix-morph` but at a UI scale. Edge midpoints fade + scale away
// while the four corners and the center stay, all under a slight rotation
// so the closed→open transition reads as a flip rather than a swap.

interface DotMatrixMenuIconProps {
  open: boolean;
  className?: string;
}

const DOTS: Array<{ cx: number; cy: number; isArm: boolean }> = [
  { cx: 4,  cy: 4,  isArm: true  }, // TL
  { cx: 12, cy: 4,  isArm: false }, // TM
  { cx: 20, cy: 4,  isArm: true  }, // TR
  { cx: 4,  cy: 12, isArm: false }, // ML
  { cx: 12, cy: 12, isArm: true  }, // CC
  { cx: 20, cy: 12, isArm: false }, // MR
  { cx: 4,  cy: 20, isArm: true  }, // BL
  { cx: 12, cy: 20, isArm: false }, // BM
  { cx: 20, cy: 20, isArm: true  }, // BR
];

export function DotMatrixMenuIcon({ open, className }: DotMatrixMenuIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={`block transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
        open ? 'rotate-45' : 'rotate-0'
      } ${className ?? ''}`}
    >
      {DOTS.map((d) => {
        const visible = open ? d.isArm : true;
        return (
          <circle
            key={`${d.cx}-${d.cy}`}
            cx={d.cx}
            cy={d.cy}
            r={1.6}
            fill="currentColor"
            style={{
              transition:
                'opacity 280ms cubic-bezier(0.22,1,0.36,1), transform 280ms cubic-bezier(0.22,1,0.36,1)',
              transformBox: 'fill-box',
              transformOrigin: 'center',
              opacity: visible ? 1 : 0,
              transform: visible ? 'scale(1)' : 'scale(0.2)',
            }}
          />
        );
      })}
    </svg>
  );
}
