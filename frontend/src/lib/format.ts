const integer = new Intl.NumberFormat('en-MY', { maximumFractionDigits: 0 });
const oneDecimal = new Intl.NumberFormat('en-MY', { maximumFractionDigits: 1 });

export function formatKcal(value: number): string {
  return integer.format(Math.round(value));
}

export function formatGrams(value: number): string {
  return `${value < 10 ? oneDecimal.format(value) : integer.format(Math.round(value))} g`;
}

export function formatPercent(fraction: number): string {
  return `${Math.round(fraction * 100)}%`;
}

export function formatSigned(value: number): string {
  if (value === 0) return '0';
  return `${value > 0 ? '+' : '−'}${integer.format(Math.abs(Math.round(value)))}`;
}

/** Axis ticks: 0, 500, 1K, 1.5K … */
export function formatCompact(value: number): string {
  if (value < 1000) return integer.format(value);
  return `${oneDecimal.format(value / 1000)}K`;
}
