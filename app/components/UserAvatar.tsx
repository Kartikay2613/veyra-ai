'use client';

/**
 * UserAvatar — Procedural, highly detailed avatar component.
 * Features:
 * - Deterministic gradient generation based on name/initials.
 * - Rotating decorative concentric ring overlay (spinning SVG dash ring).
 * - Premium badges (Crown for 1st, Spark/Star for 2nd/3rd, Flame for high streaks).
 * - Elegant glow-shadows and text positioning.
 */

interface UserAvatarProps {
  name: string;
  initials: string;
  color?: string; // fallback or override
  size?: number;
  rank?: number;
  streak?: number;
  showGlow?: boolean;
  isCurrentUser?: boolean;
}

// Deterministic gradients based on name seed
const GRADIENTS = [
  'linear-gradient(135deg, #FF4E1F 0%, #FF9E00 100%)', // Orange/Ignition
  'linear-gradient(135deg, #2D4FFF 0%, #00C6FF 100%)', // Blue/Surge
  'linear-gradient(135deg, #7000FF 0%, #FF007A 100%)', // Violet/Pink
  'linear-gradient(135deg, #1FA77A 0%, #00E575 100%)', // Green/Win
  'linear-gradient(135deg, #8A2387 0%, #E94057 100%)', // Purple/Red
  'linear-gradient(135deg, #F27121 0%, #E94057 100%)', // Sunset
  'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)', // Teal/Lime
];

function getGradient(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % GRADIENTS.length;
  return GRADIENTS[index];
}

export default function UserAvatar({
  name,
  initials,
  color,
  size = 40,
  rank,
  streak,
  showGlow = false,
  isCurrentUser = false,
}: UserAvatarProps) {
  const gradientBg = color ? `linear-gradient(135deg, ${color} 0%, rgba(255,255,255,0.1) 100%)` : getGradient(name);
  const ringSize = size + 8; // Concentric ring bounds

  // Determine badge overlays
  const isTop3 = rank !== undefined && rank <= 3;

  return (
    <div
      className={`avatar-container ${isCurrentUser ? 'avatar-current' : ''}`}
      style={{
        position: 'relative',
        width: ringSize,
        height: ringSize,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        userSelect: 'none',
      }}
    >
      {/* 1. Concentric Dotted SVG Rotation Ring (Gives lively SaaS motion) */}
      <svg
        style={{
          position: 'absolute',
          inset: 0,
          transform: 'rotate(0deg)',
          animation: 'spin-avatar-ring 20s linear infinite',
        }}
        viewBox="0 0 100 100"
      >
        <circle
          cx="50"
          cy="50"
          r="46"
          stroke={isCurrentUser ? 'var(--color-ignition)' : 'var(--color-mist)'}
          strokeWidth="2.5"
          strokeDasharray="6 8"
          fill="none"
          opacity={isCurrentUser ? 1 : 0.65}
        />
        {isCurrentUser && (
          <circle
            cx="50"
            cy="50"
            r="46"
            stroke="var(--color-ignition)"
            strokeWidth="2.5"
            strokeDasharray="40 100"
            fill="none"
            opacity="0.3"
            style={{
              animation: 'pulse-ring 2s ease-in-out infinite alternate',
            }}
          />
        )}
      </svg>

      {/* 2. Core Avatar Surface */}
      <div
        className="avatar-core"
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          background: gradientBg,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#FFFFFF',
          fontWeight: 700,
          fontSize: `${size * 0.38}px`,
          fontFamily: 'var(--font-mono)',
          boxShadow: showGlow
            ? `0 0 14px ${color || 'var(--color-ignition-12)'}, var(--shadow-sm)`
            : 'var(--shadow-sm)',
          zIndex: 2,
          border: '2.5px solid var(--color-surface)',
          transition: 'transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
        }}
      >
        <span>{initials.toUpperCase()}</span>
      </div>

      {/* 3. Rank Medal Badge Overlays */}
      {isTop3 && (
        <div
          className="avatar-badge-rank"
          style={{
            position: 'absolute',
            top: -6,
            right: -6,
            width: 20,
            height: 20,
            borderRadius: '50%',
            backgroundColor: 'var(--color-surface)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '11px',
            boxShadow: 'var(--shadow-sm)',
            zIndex: 3,
            border: `1.5px solid ${
              rank === 1
                ? 'var(--color-ignition)'
                : rank === 2
                ? 'var(--color-surge)'
                : '#C49A45'
            }`,
          }}
        >
          {rank === 1 ? '🥇' : rank === 2 ? '🥈' : '🥉'}
        </div>
      )}

      {/* 4. Streak Flame Overlay (Bottom Right) */}
      {streak !== undefined && streak >= 3 && !isTop3 && (
        <div
          className="avatar-badge-streak"
          style={{
            position: 'absolute',
            bottom: -2,
            right: -2,
            width: 18,
            height: 18,
            borderRadius: '50%',
            backgroundColor: 'var(--color-surface)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '10px',
            boxShadow: 'var(--shadow-sm)',
            zIndex: 3,
            border: '1.5px solid var(--color-ignition)',
          }}
          title={`${streak} day streak!`}
        >
          🔥
        </div>
      )}

      <style jsx global>{`
        @keyframes spin-avatar-ring {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        @keyframes pulse-ring {
          0% {
            transform: scale(0.96) rotate(0deg);
            opacity: 0.2;
          }
          100% {
            transform: scale(1.04) rotate(90deg);
            opacity: 0.55;
          }
        }
        .avatar-container:hover .avatar-core {
          transform: scale(1.1);
        }
      `}</style>
    </div>
  );
}
