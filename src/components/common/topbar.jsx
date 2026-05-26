import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  AppBar,
  Avatar,
  Box,
  Chip,
  Divider,
  IconButton,
  ListItemIcon,
  ListSubheader,
  Menu,
  MenuItem,
  TextField,
  Toolbar,
  Typography,
} from '@mui/material';
import AccountCircle from '@mui/icons-material/AccountCircle';
import LogoutIcon from '@mui/icons-material/Logout';
import CheckIcon from '@mui/icons-material/Check';
import { useSnackbar } from 'notistack';
import { logout, setRoles } from '@/common/features/auth/authSlice';
import { PREDEFINED_ROLE_SETS } from '@/services/auth.service';
import {
  clearCustomer,
  selectCustomer,
  selectHasCustomer,
  setCustomer,
} from '@/common/features/customer/customerSlice';
import userService from '@/services/user.service';

const IS_DEV = import.meta.env.DEV;

const CUSTOMER_SCOPED_PATHS = ['/data', '/subscriptions', '/invoices'];

const rolesEqual = (a = [], b = []) =>
  a.length === b.length && [...a].sort().join('|') === [...b].sort().join('|');

const initials = (str = '') =>
  str
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('') || 'U';

const Topbar = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { enqueueSnackbar } = useSnackbar();
  const user = useSelector((s) => s.auth.user);
  const isAuthenticated = useSelector((s) => s.auth.isAuthenticated);
  const customer = useSelector(selectCustomer);
  const hasCustomer = useSelector(selectHasCustomer);
  const [anchorEl, setAnchorEl] = useState(null);
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);

  if (!isAuthenticated) return null;

  const open = Boolean(anchorEl);
  const handleOpen = (e) => setAnchorEl(e.currentTarget);
  const handleClose = () => setAnchorEl(null);

  const currentRoles = user?.roles || [];
  const rolesLabel = currentRoles.length ? currentRoles.join(', ') : '(sin roles)';

  const handleSearch = async (e) => {
    e.preventDefault();
    const key = query.trim();
    if (!key || searching) return;
    setSearching(true);
    try {
      const data = await userService.searchByEmail(key);
      if (!data) {
        enqueueSnackbar('Usuario no encontrado', { variant: 'warning' });
        return;
      }
      dispatch(setCustomer(data));
      const name = data.evUser?.display_name || data.evUser?.email_address || 'usuario';
      enqueueSnackbar(`Usuario cargado: ${name}`, { variant: 'success' });
      setQuery('');
      if (!CUSTOMER_SCOPED_PATHS.includes(location.pathname)) {
        navigate('/data');
      }
    } finally {
      setSearching(false);
    }
  };

  const handleClearCustomer = () => {
    dispatch(clearCustomer());
    if (CUSTOMER_SCOPED_PATHS.includes(location.pathname)) {
      navigate('/');
    }
  };

  const handlePickRoles = (roles) => {
    dispatch(setRoles(roles));
    handleClose();
  };

  const handleLogout = () => {
    handleClose();
    dispatch(logout());
  };

  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        bgcolor: 'background.paper',
        color: 'text.primary',
        borderBottom: '1px solid',
        borderColor: 'divider',
      }}
    >
      <Toolbar sx={{ gap: 2 }}>
        <Box component="form" onSubmit={handleSearch} sx={{ flexGrow: 1, maxWidth: 520 }}>
          <TextField
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar usuario por uid, email, username o id de cliente…"
            size="small"
            fullWidth
            disabled={searching}
            inputProps={{ 'aria-label': 'Buscar usuario' }}
          />
        </Box>

        <Box sx={{ flexGrow: 1 }} />

        {hasCustomer && (
          <Chip
            avatar={
              <Avatar
                sx={{
                  bgcolor: 'secondary.main',
                  color: 'secondary.contrastText',
                  fontSize: 12,
                  fontWeight: 600,
                }}
              >
                {initials(customer.displayName || customer.email || '')}
              </Avatar>
            }
            label={customer.displayName || customer.email}
            onDelete={handleClearCustomer}
            variant="outlined"
            sx={{ fontWeight: 500, maxWidth: 240 }}
          />
        )}

        <Box sx={{ textAlign: 'right', display: { xs: 'none', sm: 'block' } }}>
          <Typography variant="body2" sx={{ lineHeight: 1.2 }}>
            {user?.name || user?.email || 'Usuario'}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {rolesLabel}
          </Typography>
        </Box>
        <IconButton
          aria-label="Cuenta"
          onClick={handleOpen}
          size="large"
          sx={{ color: 'primary.main' }}
        >
          <AccountCircle fontSize="large" />
        </IconButton>
        <Menu
          anchorEl={anchorEl}
          open={open}
          onClose={handleClose}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          transformOrigin={{ vertical: 'top', horizontal: 'right' }}
          slotProps={{ sx: { minWidth: 260 } }}
        >
          <ListSubheader sx={{ bgcolor: 'transparent', lineHeight: 1.4, py: 1 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
              {user?.name || user?.email || 'Usuario'}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Roles: {rolesLabel}
            </Typography>
          </ListSubheader>

          {IS_DEV && <Divider />}
          {IS_DEV && (
            <ListSubheader sx={{ bgcolor: 'transparent', fontSize: '0.7rem' }}>
              Cambiar roles (dev)
            </ListSubheader>
          )}
          {IS_DEV &&
            PREDEFINED_ROLE_SETS.map((set) => {
              const selected = rolesEqual(set.roles, currentRoles);
              return (
                <MenuItem
                  key={set.label}
                  onClick={() => handlePickRoles(set.roles)}
                  selected={selected}
                  dense
                >
                  <ListItemIcon sx={{ minWidth: 28 }}>
                    {selected && <CheckIcon fontSize="small" color="primary" />}
                  </ListItemIcon>
                  {set.label}
                </MenuItem>
              );
            })}

          <Divider />
          <MenuItem onClick={handleLogout}>
            <ListItemIcon>
              <LogoutIcon fontSize="small" />
            </ListItemIcon>
            Cerrar sesión
          </MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  );
};

export default Topbar;
