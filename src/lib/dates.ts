/**
 * Calendar-date helpers for admin date inputs (`YYYY-MM-DD`).
 *
 * Convention: treat event/filter dates as **UTC calendar dates** (not local
 * wall-clock instants). Storing UTC noon reduces accidental day-shifts when
 * serializing through timezones between browser date pickers and PostgreSQL.
 */

const DATE_ONLY = /^(\d{4})-(\d{2})-(\d{2})$/;

export function parseUtcDateOnly(input: string | Date): Date {
  if (input instanceof Date) {
    if (Number.isNaN(input.getTime())) {
      throw new Error("Invalid date");
    }
    return new Date(
      Date.UTC(input.getUTCFullYear(), input.getUTCMonth(), input.getUTCDate(), 12, 0, 0, 0),
    );
  }
  const match = DATE_ONLY.exec(input.trim());
  if (!match) {
    const coerced = new Date(input);
    if (Number.isNaN(coerced.getTime())) {
      throw new Error("Invalid date");
    }
    return new Date(
      Date.UTC(
        coerced.getUTCFullYear(),
        coerced.getUTCMonth(),
        coerced.getUTCDate(),
        12,
        0,
        0,
        0,
      ),
    );
  }
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  return new Date(Date.UTC(year, month - 1, day, 12, 0, 0, 0));
}

export function startOfUtcDay(input: string | Date): Date {
  const d = parseUtcDateOnly(input);
  return new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0, 0),
  );
}

export function endOfUtcDay(input: string | Date): Date {
  const d = parseUtcDateOnly(input);
  return new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 23, 59, 59, 999),
  );
}

export function toDateInputValue(iso: string | Date | null | undefined): string {
  if (!iso) return "";
  const d = typeof iso === "string" ? new Date(iso) : iso;
  if (Number.isNaN(d.getTime())) return "";
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
