import 'server-only';

import type { StreakStatus } from '@/types/streaks';

export function getStreakStatus({
  currentCount,
  lastCountedOn,
  timezone,
  now = new Date(),
}: {
  currentCount: number;
  lastCountedOn: string | null;
  timezone: string;
  now?: Date;
}): StreakStatus {
  const today = getLocalDateKey(now, timezone);
  const yesterday = getLocalDateKey(
    new Date(now.getTime() - 24 * 60 * 60 * 1000),
    timezone,
  );

  if (!lastCountedOn || currentCount === 0) {
    return {
      state: 'start',
      label: 'Start today',
      message: 'One successful publish starts the streak clock.',
    };
  }

  if (lastCountedOn === today) {
    return {
      state: 'safe',
      label: 'Protected',
      message: 'Today is counted. Anything else is bonus rhythm.',
    };
  }

  if (lastCountedOn === yesterday) {
    return {
      state: 'at_risk',
      label: 'Post today',
      message: 'Publish once before local midnight to keep the streak alive.',
    };
  }

  return {
    state: 'missed',
    label: 'Restart ready',
    message:
      'The last streak lapsed. A new one can start with the next publish.',
  };
}

function getLocalDateKey(date: Date, timezone: string) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);

  const byType = new Map(parts.map(part => [part.type, part.value]));

  return `${byType.get('year')}-${byType.get('month')}-${byType.get('day')}`;
}
