import { useCallback, useEffect, useState } from 'react';
import { useSnackbar } from 'notistack';
import beneficiariesService from '@/services/beneficiaries.service';

// Carga (y recarga) la lista de beneficiarios de una suscripción concreta.
// Mismo patrón que useSubscriptions (useEffect + service + loading + errores por
// snackbar), pero expone `reload` porque la lista cambia tras añadir/borrar.
export const useBeneficiaries = (guid, subscriptionId, enabled) => {
  const { enqueueSnackbar } = useSnackbar();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  const reload = useCallback(() => {
    if (!enabled || !guid || !subscriptionId) {
      setData([]);
      return Promise.resolve();
    }
    setLoading(true);
    return Promise.resolve(beneficiariesService.list(guid, subscriptionId))
      .then((result) => setData(Array.isArray(result) ? result : []))
      .catch((error) => {
        setData([]);
        enqueueSnackbar('Error al cargar beneficiarios: ' + error.message, { variant: 'error' });
      })
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [guid, subscriptionId, enabled]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { data, loading, reload };
};
