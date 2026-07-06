import { useContext, useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  IconButton,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import { useSnackbar } from 'notistack';
import { useHasPrivilege } from '@/common/permissions/useHasPrivilege';
import { useActionAllowed } from '@/common/permissions/permissions';
import { Priv } from '@/common/permissions/privileges';
import { ModalContext } from '@/common/providers/ModalProvider';
import { sortByText } from '@/common/sort';
import landingsService from '@/services/landings.service';

const isHtmlFile = (file) => !!file && /\.html?$/i.test(file.name);

const HtLandings = () => {
  const { enqueueSnackbar } = useSnackbar();
  const modal = useContext(ModalContext);
  const canEdit = useHasPrivilege(Priv.EDIT_HERRAMIENTAS);
  // Gating por ACCIÓN (default-deny): subir y borrar son acciones distintas.
  const canLandingUpload = useActionAllowed('herramientas.landingUpload');
  const canLandingDelete = useActionAllowed('herramientas.landingDelete');

  const [landings, setLandings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [htmlFile, setHtmlFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const canSubmit = htmlFile && isHtmlFile(htmlFile) && !uploading && canLandingUpload;

  // Landings is global (no customer dependency) — load once on mount.
  const loadLandings = () => {
    setLoading(true);
    return landingsService
      .list()
      .then((data) => setLandings(sortByText(Array.isArray(data) ? data : [])))
      .catch((error) => {
        setLandings([]);
        enqueueSnackbar('Error al cargar landings: ' + error.message, { variant: 'error' });
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    let active = true;
    setLoading(true);
    landingsService
      .list()
      .then((data) => active && setLandings(sortByText(Array.isArray(data) ? data : [])))
      .catch((error) => {
        if (!active) return;
        setLandings([]);
        enqueueSnackbar('Error al cargar landings: ' + error.message, { variant: 'error' });
      })
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFileChange = (event) => {
    const file = event.target.files?.[0] || null;
    if (file && !isHtmlFile(file)) {
      enqueueSnackbar('El fichero debe tener extensión .html', { variant: 'error' });
      setHtmlFile(null);
      return;
    }
    setHtmlFile(file);
  };

  const handleUpload = async (event) => {
    event.preventDefault();
    if (!canSubmit) return;
    setUploading(true);
    try {
      await landingsService.upload(htmlFile);
      enqueueSnackbar('Landing subida correctamente.', { variant: 'success' });
      setHtmlFile(null);
      await loadLandings();
    } catch (error) {
      enqueueSnackbar('Error al subir la landing: ' + error.message, { variant: 'error' });
    } finally {
      setUploading(false);
    }
  };

  const runDelete = async (ruta) => {
    try {
      await landingsService.remove(ruta);
      enqueueSnackbar('Landing eliminada.', { variant: 'success' });
      await loadLandings();
    } catch (error) {
      enqueueSnackbar('Error al eliminar la landing: ' + error.message, { variant: 'error' });
    }
  };

  const confirmDelete = (ruta) => {
    modal.show({
      title: 'Eliminar landing',
      content: `Vas a eliminar la landing «${ruta}». Esta acción no se puede deshacer. ¿Continuar?`,
      confirmText: 'Eliminar',
      variant: 'error',
      secondaryBtnText: 'Cancelar',
      onSubmit: () => runDelete(ruta),
    });
  };

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="overline" color="text.secondary">
          Herramientas
        </Typography>
        <Typography variant="h4" sx={{ mt: 0.25 }}>
          Landings
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          Gestión de los ficheros HTML de landings. Sube nuevas landings o elimina las existentes.
        </Typography>
      </Box>

      {!canEdit ? (
        <Alert severity="info" variant="outlined">
          No tienes permiso para esta acción.
        </Alert>
      ) : (
        <Stack spacing={3}>
          {canLandingUpload && (
          <Paper variant="outlined" sx={{ p: { xs: 3, md: 4 }, maxWidth: 520 }}>
            <Typography variant="h6" sx={{ mb: 1.5 }}>
              Subir landing
            </Typography>
            <Box component="form" onSubmit={handleUpload}>
              <Stack spacing={2.5}>
                <Box>
                  <Button
                    component="label"
                    variant="outlined"
                    startIcon={<UploadFileIcon />}
                    disabled={uploading}
                  >
                    Seleccionar HTML
                    <input type="file" accept=".html,.htm" hidden onChange={handleFileChange} />
                  </Button>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    {htmlFile ? htmlFile.name : 'Ningún fichero seleccionado'}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <Button
                    type="submit"
                    variant="contained"
                    disabled={!canSubmit}
                    startIcon={uploading ? <CircularProgress size={16} /> : null}
                  >
                    Subir
                  </Button>
                </Box>
              </Stack>
            </Box>
          </Paper>
          )}

          <Paper variant="outlined" sx={{ p: { xs: 3, md: 4 } }}>
            <Typography variant="h6" sx={{ mb: 1.5 }}>
              Landings existentes
            </Typography>

            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
                <CircularProgress size={28} />
              </Box>
            ) : landings.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                No hay landings.
              </Typography>
            ) : (
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Nombre</TableCell>
                      <TableCell align="right">Acciones</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {landings.map((name) => (
                      <TableRow key={name} hover>
                        <TableCell>{name}</TableCell>
                        <TableCell align="right">
                          {canLandingDelete && (
                            <Tooltip title="Eliminar">
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => confirmDelete(name)}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Paper>
        </Stack>
      )}
    </Box>
  );
};

export default HtLandings;
