'use client';

/**
 * LeaderboardRow — A single row in the leaderboard list.
 *
 * Shows: rank number, avatar circle with initials, name, mini SprintTrack,
 * and a streak count. Current user's row has an Ignition orange border.
 *
 * Props:
 *   rank        — Position in the leaderboard (1-indexed)
 *   user        — SprintUser data object
 *   todayDay    — Current sprint day (for the mini track)
 *
 * React Native port:
 *   Replace outer div with View, text elements with Text components.
 *   Use a TouchableOpacity wrapper if rows become tappable.
 */

import { Flame } from 'lucide-react';

import UserAvatar from './UserAvatar';
import type { SprintUser } from '@/app/lib/data';

interface LeaderboardRowProps {
  rank: number;
  user: SprintUser;
  todayDay: number;
}

export default function LeaderboardRow({ rank, user, todayDay }: LeaderboardRowProps) {
  const isTop3 = rank <= 3;
  const rankDisplay = `#${rank}`;

  return (
    <div
      id={`leaderboard-row-${user.id}`}
      className={`leaderboard-row${user.isCurrentUser ? ' leaderboard-row--current-user' : ''}`}
      aria-label={`${rank}. ${user.name}, ${user.xp} XP, ${user.daysCompleted} days completed, ${user.streak}-day streak${user.isCurrentUser ? ' (you)' : ''}`}
    >
      {/* Rank */}
      <span
        className={`leaderboard-row__rank${isTop3 ? ' leaderboard-row__rank--top' : ''}`}
        aria-hidden="true"
        style={{
          color: rank === 1 ? 'var(--color-ignition)' : rank === 2 ? 'var(--color-surge)' : rank === 3 ? '#C49A45' : 'var(--color-ink-40)'
        }}
      >
        {rankDisplay}
      </span>

      {/* Avatar */}
      <UserAvatar
        name={user.name}
        initials={user.initials}
        color={user.color}
        size={34}
        rank={rank}
        streak={user.streak}
        isCurrentUser={user.isCurrentUser}
      />

      {/* Name + XP */}
      <div className="leaderboard-row__info">
        <span className="leaderboard-row__name">
          {user.name}
          {user.isCurrentUser && (
            <span style={{ color: 'var(--color-ignition)', marginLeft: 6, fontSize: '0.75rem' }}>
              you
            </span>
          )}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
          <span className="text-mono" style={{ color: 'var(--color-ignition)', fontWeight: 700, fontSize: '0.85rem' }}>
            {user.xp} XP
          </span>
          <span style={{ color: 'var(--color-ink-40)', fontSize: '0.75rem' }}>
            ({user.daysCompleted} days)
          </span>
        </div>
      </div>

      {/* Streak */}
      <div className="leaderboard-row__streak" aria-hidden="true" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <Flame size={14} color="var(--color-ignition)" fill="var(--color-ignition)" />
        <span className="text-mono">{user.streak}</span>
      </div>
    </div>
  );
}
