import parse from "parse-duration";

const MILLISECONDS_PER_HOUR = 3600000;
const HOURS_PER_DAY = 24;
const DAYS_PER_WEEK = 7;

export const parseDurationToHours = (
  input: string
): number | null => {
  if (!input || input.trim() === "") {
    return null;
  }

  const trimmedInput = input.trim();

  // Try to parse as a plain number first
  const numericValue = Number(trimmedInput);
  if (!isNaN(numericValue)) {
    return numericValue;
  }

  // Use parse-duration to convert to milliseconds
  const milliseconds = parse(trimmedInput);

  if (milliseconds === null || milliseconds === undefined) {
    return null;
  }

  // Convert milliseconds to hours
  return milliseconds / MILLISECONDS_PER_HOUR;
};

export const formatHoursToDuration = (
  hours: number | null | undefined
): string | null => {
  if (hours === null || hours === undefined) {
    return null;
  }

  if (hours === 0) {
    return "0h";
  }

  let remainingHours = hours;
  const parts: string[] = [];

  // Calculate weeks
  const weeks = Math.floor(remainingHours / (HOURS_PER_DAY * DAYS_PER_WEEK));
  if (weeks > 0) {
    parts.push(`${weeks}w`);
    remainingHours -= weeks * HOURS_PER_DAY * DAYS_PER_WEEK;
  }

  // Calculate days
  const days = Math.floor(remainingHours / HOURS_PER_DAY);
  if (days > 0) {
    parts.push(`${days}d`);
    remainingHours -= days * HOURS_PER_DAY;
  }

  // Calculate hours
  const wholeHours = Math.floor(remainingHours);
  if (wholeHours > 0) {
    parts.push(`${wholeHours}h`);
    remainingHours -= wholeHours;
  }

  // Calculate minutes
  const minutes = Math.round(remainingHours * 60);
  if (minutes > 0) {
    parts.push(`${minutes}m`);
  }

  return parts.length > 0 ? parts.join(" ") : "0h";
};
