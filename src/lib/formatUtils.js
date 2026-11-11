/**
 * Utilities for formatting dynamic counts, singular/plural grammar, and durations
 */

export function formatPlural(count, singular, plural = `${singular}s`) {
  const n = Number(count) || 0;
  return `${n} ${n === 1 ? singular : plural}`;
}

export function formatLessons(count) {
  return formatPlural(count, 'lesson', 'lessons');
}

export function formatModules(count) {
  return formatPlural(count, 'module', 'modules');
}

export function formatEnrolled(count) {
  const n = Number(count) || 0;
  return `${n} enrolled`;
}

export function formatDurationHours(hours, fallback = 'Self-paced') {
  const h = Number(hours) || 0;
  if (h <= 0) return fallback;
  return `${h} ${h === 1 ? 'hour' : 'hours'}`;
}

export function formatTotalDuration(durationHours, totalDurationSeconds, fallback = 'Self-paced') {
  if (totalDurationSeconds && Number(totalDurationSeconds) > 0) {
    const totalSec = Number(totalDurationSeconds);
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    if (h > 0 && m > 0) return `${h}h ${m}m`;
    if (h > 0) return `${h} ${h === 1 ? 'hour' : 'hours'}`;
    return `${m} ${m === 1 ? 'min' : 'mins'}`;
  }

  const h = Number(durationHours) || 0;
  if (h <= 0) return fallback;
  return `${h} ${h === 1 ? 'hour' : 'hours'}`;
}
