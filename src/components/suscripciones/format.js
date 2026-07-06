// Formateo defensivo de fechas: los endpoints de suscripciones devuelven la fecha
// en formatos distintos según el modelo backend — String ya formateada o ISO
// (EvolokSubscription/AppleSubscription/BeneficiarySubscription), Instant
// (ThirdPartiesSubscription, serializado como ISO o epoch) y LocalDate
// (Subscription print, que Jackson puede serializar como array [y,m,d]).
export const formatDate = (value) => {
  if (value == null || value === '') return '—';

  // LocalDate serializado como [year, month, day]
  if (Array.isArray(value)) {
    const [year, month, day] = value;
    if (year && month && day) return new Date(year, month - 1, day).toLocaleDateString('es-ES');
    return '—';
  }

  // epoch (segundos o milisegundos)
  if (typeof value === 'number') {
    const date = new Date(value < 1e12 ? value * 1000 : value);
    return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleDateString('es-ES');
  }

  // String: ISO / Instant / ya formateada
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleDateString('es-ES');
};

// Epoch (ms) de una fecha de suscripción en cualquiera de los formatos de arriba,
// para ordenar de forma determinista. Devuelve NaN si no es interpretable.
const toEpoch = (value) => {
  if (value == null || value === '') return NaN;
  if (Array.isArray(value)) {
    const [year, month, day] = value;
    return year && month && day ? new Date(year, month - 1, day).getTime() : NaN;
  }
  if (typeof value === 'number') return new Date(value < 1e12 ? value * 1000 : value).getTime();
  return new Date(value).getTime();
};

// Orden de presentación por fecha de inicio descendente (estable). Las filas sin
// fecha interpretable van al final. No muta el array original.
export const sortByStartDateDesc = (rows, getStartDate = (row) => row?.startDate) =>
  [...(rows || [])].sort((a, b) => {
    const epochA = toEpoch(getStartDate(a));
    const epochB = toEpoch(getStartDate(b));
    const validA = !Number.isNaN(epochA);
    const validB = !Number.isNaN(epochB);
    if (!validA && !validB) return 0;
    if (!validA) return 1;
    if (!validB) return -1;
    return epochB - epochA;
  });
