import { useCallback, useContext, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { Paper, Stack, Typography } from '@mui/material';
import { useSnackbar } from 'notistack';
import { selectCustomer } from '@/common/features/customer/customerSlice';
import { useHasPrivilege } from '@/common/permissions/useHasPrivilege';
import { useActionAllowed } from '@/common/permissions/permissions';
import { Priv } from '@/common/permissions/privileges';
import { ModalContext } from '@/common/providers/ModalProvider';
import subscriptionsService from '@/services/subscriptions.service';
import subscriptionActionsService from '@/services/subscriptionActions.service';
import SubscriptionsTable from '@/components/suscripciones/SubscriptionsTable';
import SubscriptionActionsMenu from '@/components/subscriptionActions/SubscriptionActionsMenu';
import ReassignDialog from '@/components/subscriptionActions/ReassignDialog';
import { formatDate, sortByStartDateDesc } from '@/components/suscripciones/format';

// Lectura de errores del backend (validationErrors / errorMessage), igual que
// datos/index.jsx.
const readErrorMessage = (error) => {
  const rawMessage = error?.message || '';
  const jsonPart = rawMessage.slice(rawMessage.indexOf('{'));
  try {
    const parsed = JSON.parse(jsonPart);
    if (parsed.validationErrors?.length) {
      return parsed.validationErrors
        .map((validationError) => `${validationError.field}: ${validationError.message}`)
        .join('; ');
    }
    return parsed.errorMessage || rawMessage;
  } catch {
    return rawMessage;
  }
};

// Carga recargable: como useSubscriptions pero exponiendo un `reload()` para
// refrescar la tabla tras una acción (no toco el hook compartido).
const useReloadableSubscriptions = (fetcher, guid, label) => {
  const { enqueueSnackbar } = useSnackbar();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    if (!guid) {
      setData([]);
      setLoading(false);
      return Promise.resolve();
    }
    setLoading(true);
    return Promise.resolve(fetcher(guid))
      .then((result) => setData(Array.isArray(result) ? result : []))
      .catch((error) => {
        setData([]);
        enqueueSnackbar('Error al cargar ' + label + ': ' + error.message, { variant: 'error' });
      })
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [guid]);

  useEffect(() => {
    let active = true;
    load().finally(() => {
      if (!active) return;
    });
    return () => {
      active = false;
    };
  }, [load]);

  return { data, loading, reload: load };
};

const SuscTienda = () => {
  const { enqueueSnackbar } = useSnackbar();
  const modal = useContext(ModalContext);
  const customer = useSelector(selectCustomer);
  const canEdit = useHasPrivilege(Priv.EDIT_SUSCRIPCIONES);
  // Gating por ACCIÓN (default-deny): el canal Apple usa appleAction; el canal Google, googleAction.
  const canAppleAction = useActionAllowed('suscripciones.appleAction');
  const canGoogleAction = useActionAllowed('suscripciones.googleAction');
  const isKindAllowed = (kind) => (kind === 'google' ? canGoogleAction : canAppleAction);
  const guid = customer?.raw?.evUser?.guid;
  const currentEmail = customer?.raw?.evUser?.email_address;

  const apple = useReloadableSubscriptions(
    subscriptionsService.getApple,
    guid,
    'suscripciones Apple',
  );
  const thirdParties = useReloadableSubscriptions(
    subscriptionsService.getThirdParties,
    guid,
    'suscripciones de terceros',
  );

  const [runningAction, setRunningAction] = useState(false);
  const [reassign, setReassign] = useState(null); // { row, kind, reload } | null

  // kind: 'apple' | 'google' -> servicio. Para terceros tipo "A" se usa el
  // canal Apple y para "G" el canal Google (como el BO antiguo).
  const callAction = (kind, payload) =>
    kind === 'google'
      ? subscriptionActionsService.googleAction(payload)
      : subscriptionActionsService.appleAction(payload);

  const runAction = async (kind, payload, successMessage, reload) => {
    setRunningAction(true);
    try {
      await callAction(kind, payload);
      enqueueSnackbar(successMessage, { variant: 'success' });
      await reload();
    } catch (error) {
      enqueueSnackbar('Error: ' + readErrorMessage(error), { variant: 'error' });
    } finally {
      setRunningAction(false);
    }
  };

  // payload base por fila: para terceros incluye `type` (A/G), que el backend
  // deja pasar dentro del Jaxson.
  const basePayload = (row, kind) => ({
    subscriptionId: row.subscriptionId,
    guid,
    ...(kind === 'google' && row.type ? { type: row.type } : {}),
  });

  const handleUnassign = (kind, reload) => (row) => {
    modal.show({
      title: 'Desasignar suscripción',
      content: `Se va a desasignar la suscripción ${row.subscriptionId || ''} del usuario actual. ¿Continuar?`,
      confirmText: 'Desasignar',
      variant: 'error',
      onSubmit: () =>
        runAction(kind, { action: 'unassign', ...basePayload(row, kind) }, 'Suscripción desasignada', reload),
    });
  };

  const handleForce = (kind, reload) => (row) => {
    modal.show({
      title: 'Forzar entrega',
      content: `Se va a forzar la entrega de la suscripción ${row.subscriptionId || ''}. ¿Continuar?`,
      confirmText: 'Forzar entrega',
      onSubmit: () =>
        runAction(kind, { action: 'force', ...basePayload(row, kind) }, 'Entrega forzada', reload),
    });
  };

  // Reasignar: paso 1 (ReassignDialog pide email), paso 2 (modal de doble
  // confirmación con el mensaje de <actual> a <nuevo>), igual que el legacy.
  const handleReassign = (kind, reload) => (row) => {
    setReassign({ row, kind, reload });
  };

  const handleReassignConfirm = (newEmail) => {
    const { row, kind, reload } = reassign;
    setReassign(null);
    modal.show({
      title: 'Confirmar reasignación de titular',
      content: `Se va a cambiar el titular de la suscripción ${row.subscriptionId || ''} de ${currentEmail || 'el titular actual'} a ${newEmail}. ¿Quieres continuar?`,
      confirmText: 'Reasignar',
      variant: 'error',
      onSubmit: () =>
        runAction(
          kind,
          { action: 'reassign', email: newEmail, ...basePayload(row, kind) },
          'Titular reasignado',
          reload,
        ),
    });
  };

  // Columna de acciones reutilizable. `kindResolver(row)` decide el canal:
  // tabla Apple -> siempre 'apple'; terceros -> 'apple' si type === 'A', 'google' si 'G'.
  const actionsColumn = (reload, kindResolver) => ({
    key: 'actions',
    label: 'Acciones',
    align: 'right',
    render: (row) => {
      const kind = kindResolver(row);
      return (
        <SubscriptionActionsMenu
          row={row}
          disabled={!canEdit || runningAction || !isKindAllowed(kind)}
          onUnassign={handleUnassign(kind, reload)}
          onForce={handleForce(kind, reload)}
          onReassign={handleReassign(kind, reload)}
        />
      );
    },
  });

  const appleColumns = [
    { key: 'productName', label: 'Producto' },
    { key: 'subscriptionId', label: 'ID Suscripción' },
    { key: 'startDate', label: 'Inicio', render: (row) => formatDate(row.startDate) },
    { key: 'endDate', label: 'Fin', render: (row) => formatDate(row.endDate) },
    actionsColumn(apple.reload, () => 'apple'),
  ];

  const thirdPartyColumns = [
    { key: 'type', label: 'Tipo' },
    { key: 'description', label: 'Descripción', render: (row) => row.description || row.productName },
    { key: 'subscriptionId', label: 'ID Suscripción' },
    { key: 'startDate', label: 'Inicio', render: (row) => formatDate(row.startDate) },
    { key: 'endDate', label: 'Fin', render: (row) => formatDate(row.endDate) },
    actionsColumn(thirdParties.reload, (row) =>
      String(row.type).toUpperCase() === 'G' ? 'google' : 'apple',
    ),
  ];

  return (
    <Stack spacing={3}>
      <Paper variant="outlined" sx={{ p: { xs: 3, md: 4 } }}>
        <Typography variant="overline" color="text.secondary">
          Tienda
        </Typography>
        <Typography variant="h6" sx={{ mt: 0.25, mb: 1.5 }}>
          Suscripciones Apple
        </Typography>
        <SubscriptionsTable
          columns={appleColumns}
          rows={sortByStartDateDesc(apple.data)}
          loading={apple.loading}
          emptyText="El usuario no tiene suscripciones de Apple."
        />
      </Paper>

      <Paper variant="outlined" sx={{ p: { xs: 3, md: 4 } }}>
        <Typography variant="overline" color="text.secondary">
          Tienda
        </Typography>
        <Typography variant="h6" sx={{ mt: 0.25, mb: 1.5 }}>
          Suscripciones de Google
        </Typography>
        <SubscriptionsTable
          columns={thirdPartyColumns}
          rows={sortByStartDateDesc(thirdParties.data)}
          loading={thirdParties.loading}
          emptyText="El usuario no tiene suscripciones de Google."
        />
      </Paper>

      <ReassignDialog
        open={Boolean(reassign)}
        currentEmail={currentEmail}
        onClose={() => setReassign(null)}
        onConfirm={handleReassignConfirm}
      />
    </Stack>
  );
};

export default SuscTienda;
