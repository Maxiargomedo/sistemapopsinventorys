const CLP = new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', minimumFractionDigits: 0, maximumFractionDigits: 0 });

export function formatCLP(value: number | string | null | undefined): string {
  const n = Number(value || 0);
  // Intl for CLP yields $ and thousands separator with no decimals
  return CLP.format(Math.round(n));
}
