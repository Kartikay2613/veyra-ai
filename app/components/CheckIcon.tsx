'use client';

/**
 * CheckIcon — Reusable, high-fidelity SVG checkmark.
 * Inspired by Shutterstock-style clean geometries:
 * - style="filled": Filled circle with white checkmark inside (Shutterstock #2)
 * - style="outline": Transparent circle, accent border, accent checkmark (Shutterstock #3)
 * - style="plain": Standalone checkmark with no circle backdrop (Shutterstock #1)
 *
 * Includes CSS stroke-dashoffset drawing animation when animated is true.
 */

interface CheckIconProps {
  size?: number;
  variant?: 'filled' | 'outline' | 'plain';
  animated?: boolean;
  color?: string;
  className?: string;
}

export default function CheckIcon({
  size = 20,
  variant = 'filled',
  animated = true,
  color,
  className = '',
}: CheckIconProps) {
  // SVG drawing parameters for path "M 28 50 L 44 65 L 72 35" relative to 100x100 box
  const strokeColor = variant === 'filled' ? '#FFFFFF' : (color ?? 'var(--color-win)');
  const circleStrokeColor = color ?? 'var(--color-win)';
  const circleFillColor = variant === 'filled' ? (color ?? 'var(--color-win)') : 'transparent';

  return (
    <span
      className={`check-icon-wrapper ${className}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: size,
        height: size,
        verticalAlign: 'middle',
      }}
    >
      <svg
        viewBox="0 0 100 100"
        width="100%"
        height="100%"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ overflow: 'visible' }}
      >
        {/* Circle Background/Outline (Only for filled and outline modes) */}
        {variant !== 'plain' && (
          <circle
            cx="50"
            cy="50"
            r="42"
            fill={circleFillColor}
            stroke={circleStrokeColor}
            strokeWidth="8"
            className={animated ? 'check-circle-draw' : ''}
            style={{
              transition: 'all 0.3s ease',
            }}
          />
        )}

        {/* Checkmark Path */}
        <path
          d="M30 52 L45 66 L72 36"
          stroke={strokeColor}
          strokeWidth="10"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={animated ? 'check-path-draw' : ''}
          style={{
            strokeDasharray: 80,
            strokeDashoffset: animated ? 80 : 0,
            animation: animated ? 'check-draw 450ms cubic-bezier(0.19, 1, 0.22, 1) 150ms forwards' : 'none',
          }}
        />
      </svg>

      <style jsx global>{`
        @keyframes check-draw {
          to {
            stroke-dashoffset: 0;
          }
        }
        @keyframes check-circle-draw {
          from {
            stroke-dasharray: 270;
            stroke-dashoffset: 270;
          }
          to {
            stroke-dashoffset: 0;
          }
        }
        .check-circle-draw {
          animation: check-circle-draw 400ms cubic-bezier(0.1, 0.8, 0.2, 1) forwards;
        }
      `}</style>
    </span>
  );
}
