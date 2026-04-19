export function formatEventDate(
  iso: string,
  options: Intl.DateTimeFormatOptions = {
    dateStyle: "medium",
    timeStyle: "short",
  },
): string {
  return new Intl.DateTimeFormat("pt-BR", options).format(new Date(iso));
}

export function formatEventTime(iso: string): string {
  return formatEventDate(iso, { timeStyle: "short" });
}

export function formatEventDay(iso: string): string {
  return formatEventDate(iso, { dateStyle: "medium" });
}
