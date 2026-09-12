const numberFormat = new Intl.NumberFormat("es-ES");

export function formatMillions(amount: number): string {
  return `${numberFormat.format(amount)} M€`;
}
