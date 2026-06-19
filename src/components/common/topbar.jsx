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

const CUSTOMER_SCOPED_PATHS = ['/datos', '/suscripciones', '/notificaciones', '/facturacion'];

const isCustomerScoped = (pathname) =>
  CUSTOMER_SCOPED_PATHS.some((basePath) => pathname === basePath || pathname.startsWith(basePath + '/'));

const sameRoles = (firstRoles = [], secondRoles = []) =>
  firstRoles.length === secondRoles.length &&
  [...firstRoles].sort().join('|') === [...secondRoles].sort().join('|');

const getInitials = (fullName = '') =>
  fullName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join('') || 'U';

const Topbar = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { enqueueSnackbar } = useSnackbar();
  const operator = useSelector((state) => state.auth.user);
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);
  const customer = useSelector(selectCustomer);
  const hasCustomer = useSelector(selectHasCustomer);
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);

  if (!isAuthenticated) return null;

  const menuOpen = Boolean(menuAnchor);
  const openMenu = (event) => setMenuAnchor(event.currentTarget);
  const closeMenu = () => setMenuAnchor(null);

  const operatorRoles = operator?.roles || [];
  const rolesLabel = operatorRoles.length ? operatorRoles.join(', ') : '(sin roles)';

  const handleSearch = async (event) => {
    event.preventDefault();
    const searchKey = searchQuery.trim();
    if (!searchKey || searching) return;
    setSearching(true);
    try {
      const customerData = await userService.searchByEmail(searchKey);
      if (!customerData) {
        enqueueSnackbar('Usuario no encontrado', { variant: 'warning' });
        return;
      }
      dispatch(setCustomer(customerData));
      const displayName =
        customerData.evUser?.display_name || customerData.evUser?.email_address || 'usuario';
      enqueueSnackbar(`Usuario cargado: ${displayName}`, { variant: 'success' });
      setSearchQuery('');
      if (!isCustomerScoped(location.pathname)) {
        navigate('/datos');
      }
    } finally {
      setSearching(false);
    }
  };

  const handleClearCustomer = () => {
    dispatch(clearCustomer());
    if (isCustomerScoped(location.pathname)) {
      navigate('/');
    }
  };

  const handlePickRoles = (roles) => {
    dispatch(setRoles(roles));
    closeMenu();
  };

  const handleLogout = () => {
    closeMenu();
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
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
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
                {getInitials(customer.displayName || customer.email || '')}
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
            {operator?.name || operator?.email || 'Usuario'}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {rolesLabel}
          </Typography>
        </Box>
        <IconButton aria-label="Cuenta" onClick={openMenu} size="large" sx={{ color: 'primary.main' }}>
          <AccountCircle fontSize="large" />
        </IconButton>
        <Menu
          anchorEl={menuAnchor}
          open={menuOpen}
          onClose={closeMenu}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          transformOrigin={{ vertical: 'top', horizontal: 'right' }}
          slotProps={{ sx: { minWidth: 260 } }}
        >
          <ListSubheader sx={{ bgcolor: 'transparent', lineHeight: 1.4, py: 1 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
              {operator?.name || operator?.email || 'Usuario'}
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
            PREDEFINED_ROLE_SETS.map((roleSet) => {
              const selected = sameRoles(roleSet.roles, operatorRoles);
              return (
                <MenuItem
                  key={roleSet.label}
                  onClick={() => handlePickRoles(roleSet.roles)}
                  selected={selected}
                  dense
                >
                  <ListItemIcon sx={{ minWidth: 28 }}>
                    {selected && <CheckIcon fontSize="small" color="primary" />}
                  </ListItemIcon>
                  {roleSet.label}
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
