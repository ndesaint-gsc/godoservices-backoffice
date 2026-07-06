// Orden por defecto determinista para listas/catálogos cargados dinámicamente.
// El backend no garantiza un orden estable, así que ordenamos en presentación.
// Devuelve SIEMPRE una copia (no muta el array original). Locale 'es' con
// sensitivity 'base' (ignora mayúsculas/acentos) y numeric:true para que los
// números embebidos se ordenen de forma natural ("2" < "10").
export const sortByText = (items, getText = (x) => x?.name ?? x?.label ?? String(x)) =>
  [...(items || [])].sort((a, b) =>
    getText(a).localeCompare(getText(b), 'es', { sensitivity: 'base', numeric: true }),
  );
