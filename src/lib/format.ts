const numberFormat = new Intl.NumberFormat("es-ES");

export function formatMillions(amount: number): string {
  return `${numberFormat.format(amount)} M€`;
}

// La liga es en España: fijamos la zona horaria para que el servidor (que en
// Vercel funciona en UTC) muestre la hora de Madrid y no una hora de menos.
const TIME_ZONE = "Europe/Madrid";
const timeFormat = new Intl.DateTimeFormat("es-ES", {
  timeZone: TIME_ZONE,
  hour: "2-digit",
  minute: "2-digit",
});
const timeWithSecondsFormat = new Intl.DateTimeFormat("es-ES", {
  timeZone: TIME_ZONE,
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
});

export function formatTime(isoDate: string): string {
  return timeFormat.format(new Date(isoDate));
}

export function formatTimeWithSeconds(isoDate: string): string {
  return timeWithSecondsFormat.format(new Date(isoDate));
}

const dateTimeFormat = new Intl.DateTimeFormat("es-ES", {
  timeZone: TIME_ZONE,
  day: "numeric",
  month: "long",
  hour: "2-digit",
  minute: "2-digit",
});

// "14 de septiembre, 18:32"
export function formatDateTime(isoDate: string): string {
  return dateTimeFormat.format(new Date(isoDate));
}
