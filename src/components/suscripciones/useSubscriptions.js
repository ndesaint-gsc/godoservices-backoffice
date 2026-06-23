import { useEffect, useState } from 'react';
import { useSnackbar } from 'notistack';

// Carga una lista de suscripciones para el guid del cliente cargado.
// Mismo patrón que facturacion/index.jsx (useEffect + service + estado loading,
// errores vía snackbar). `fetcher` es un método de subscriptions.service (guid => Promise).
export const useSubscriptions = (fetcher, guid, label) => {
  const { enqueueSnackbar } = useSnackbar();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    if (!guid) {
      setData([]);
      setLoading(false);
      return undefined;
    }
    setLoading(true);
    Promise.resolve(fetcher(guid))
      .then((result) => active && setData(Array.isArray(result) ? result : []))
      .catch((error) => {
        if (!active) return;
        setData([]);
        enqueueSnackbar('Error al cargar ' + label + ': ' + error.message, { variant: 'error' });
      })
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [guid]);

  return { data, loading };
};
