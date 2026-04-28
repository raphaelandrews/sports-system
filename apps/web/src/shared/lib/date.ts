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

// Use for date-only strings (YYYY-MM-DD) to avoid timezone off-by-one
export function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "medium",
    timeZone: "UTC",
  }).format(new Date(`${iso}T12:00:00Z`));
}

// For bare time strings from backend ("HH:MM:SS")
export function formatTime(time: string): string {
  const [hours, minutes] = time.split(":");
  return `${hours}:${minutes}`;
}

export function isTransferWindow(): boolean {
  const day = new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    timeZone: "America/Sao_Paulo",
  }).format(new Date());
  return day === "Mon";
}
