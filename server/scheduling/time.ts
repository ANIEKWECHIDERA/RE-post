import 'server-only';

const localDateTimePattern =
  /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/;

export type ScheduledTimeResult =
  | { ok: true; iso: string }
  | { ok: false; message: string };

export function parseCreatorScheduledTime(
  value: string | null,
  timezone: string,
): ScheduledTimeResult {
  if (!value) {
    return {
      ok: false,
      message: 'Choose a date and time for scheduled posts.',
    };
  }

  if (!isValidTimeZone(timezone)) {
    return {
      ok: false,
      message: 'Choose a valid timezone before scheduling.',
    };
  }

  const match = value.match(localDateTimePattern);

  if (!match) {
    return {
      ok: false,
      message: 'Choose a valid scheduled date and time.',
    };
  }

  const [, year, month, day, hour, minute, second = '00'] = match;
  const wallClock = {
    year: Number(year),
    month: Number(month),
    day: Number(day),
    hour: Number(hour),
    minute: Number(minute),
    second: Number(second),
  };

  const instant = zonedWallClockToUtc(wallClock, timezone);

  if (!instant || Number.isNaN(instant.getTime())) {
    return {
      ok: false,
      message: 'That scheduled time could not be understood.',
    };
  }

  return {
    ok: true,
    iso: instant.toISOString(),
  };
}

export function isAtLeastOneMinuteInFuture(iso: string) {
  return Date.parse(iso) > Date.now() + 60 * 1000;
}

function isValidTimeZone(timezone: string) {
  try {
    Intl.DateTimeFormat(undefined, { timeZone: timezone });
    return true;
  } catch {
    return false;
  }
}

function zonedWallClockToUtc(
  wallClock: {
    year: number;
    month: number;
    day: number;
    hour: number;
    minute: number;
    second: number;
  },
  timezone: string,
) {
  const targetUtc = Date.UTC(
    wallClock.year,
    wallClock.month - 1,
    wallClock.day,
    wallClock.hour,
    wallClock.minute,
    wallClock.second,
  );
  let candidate = new Date(targetUtc);

  // Intl gives us the wall-clock rendering for a UTC instant in a target IANA
  // timezone. Iterating the offset correction handles normal DST boundaries
  // without adding a heavy date library this early in the build.
  for (let index = 0; index < 3; index += 1) {
    const rendered = getWallClockParts(candidate, timezone);
    const renderedUtc = Date.UTC(
      rendered.year,
      rendered.month - 1,
      rendered.day,
      rendered.hour,
      rendered.minute,
      rendered.second,
    );
    const offset = renderedUtc - targetUtc;
    candidate = new Date(candidate.getTime() - offset);
  }

  return candidate;
}

function getWallClockParts(date: Date, timezone: string) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(date);

  const byType = new Map(parts.map(part => [part.type, part.value]));
  const hour = Number(byType.get('hour'));

  return {
    year: Number(byType.get('year')),
    month: Number(byType.get('month')),
    day: Number(byType.get('day')),
    hour: hour === 24 ? 0 : hour,
    minute: Number(byType.get('minute')),
    second: Number(byType.get('second')),
  };
}
