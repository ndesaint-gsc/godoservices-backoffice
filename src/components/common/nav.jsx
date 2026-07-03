import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  Box,
  Collapse,
  Divider,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  ListSubheader,
  Toolbar,
  Typography,
} from '@mui/material';
import Home from '@mui/icons-material/Home';
import Person from '@mui/icons-material/Person';
import Subscriptions from '@mui/icons-material/Subscriptions';
import Notifications from '@mui/icons-material/Notifications';
import Receipt from '@mui/icons-material/Receipt';
import Build from '@mui/icons-material/Build';
import Security from '@mui/icons-material/Security';
import Hub from '@mui/icons-material/Hub';
import Settings from '@mui/icons-material/Settings';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import { NAV_ITEMS } from '@/common/router/nav.config';
import { useHasPrivilege } from '@/common/permissions/useHasPrivilege';
import { useTabVisible } from '@/common/permissions/permissions';
import { selectHasCustomer } from '@/common/features/customer/customerSlice';
import { useBrandConfig } from '@/common/theme/useBrand';

const DRAWER_WIDTH = 240;

const ICONS = { Home, Person, Subscriptions, Notifications, Receipt, Build, Security, Hub, Settings };

const itemSx = {
  mx: 1.25,
  my: 0.25,
  borderRadius: 1.5,
  color: 'text.secondary',
  position: 'relative',
  transition: 'background-color 120ms ease, color 120ms ease',
  '& .MuiListItemIcon-root': {
    color: 'text.secondary',
    minWidth: 36,
    transition: 'color 120ms ease',
  },
  '&:hover': {
    backgroundColor: 'action.hover',
    color: 'text.primary',
    '& .MuiListItemIcon-root': { color: 'text.primary' },
  },
  '&.active': {
    backgroundColor: 'action.selected',
    color: 'text.primary',
    '& .MuiListItemIcon-root': { color: 'secondary.main' },
    '& .MuiListItemText-primary': { fontWeight: 600 },
    '&::before': {
      content: '""',
      position: 'absolute',
      left: -10,
      top: 8,
      bottom: 8,
      width: 3,
      borderRadius: 2,
      backgroundColor: 'brandDetail.main',
    },
  },
};

const childSx = {
  ...itemSx,
  pl: 4.5,
  ml: 1.25,
};

// A leaf navigation link.
const NavLeaf = ({ to, label, icon, sx }) => {
  const Icon = icon ? ICONS[icon] : null;
  return (
    <ListItem disablePadding>
      <ListItemButton component={NavLink} to={to} end sx={sx || itemSx}>
        {Icon && (
          <ListItemIcon>
            <Icon />
          </ListItemIcon>
        )}
        <ListItemText primary={label} />
      </ListItemButton>
    </ListItem>
  );
};

// An expandable group with children. Disabled (dimmed) when it requires a customer
// and none is loaded.
const NavGroup = ({ item, locked }) => {
  const location = useLocation();
  const Icon = ICONS[item.icon];
  const hasActiveChild = item.children.some((child) => location.pathname.startsWith(child.path));
  const [open, setOpen] = useState(hasActiveChild);

  // Cuando un hijo está activo, el padre adopta el color de selección (icono + texto),
  // aunque el grupo esté plegado, para indicar qué sección contiene la página actual.
  const parentSx = hasActiveChild
    ? {
        ...itemSx,
        color: 'text.primary',
        '& .MuiListItemIcon-root': { color: 'secondary.main', minWidth: 36 },
        '& .MuiListItemText-primary': { fontWeight: 600 },
      }
    : itemSx;

  if (locked) {
    return (
      <ListItem disablePadding>
        <ListItemButton disabled sx={itemSx}>
          {Icon && (
            <ListItemIcon>
              <Icon />
            </ListItemIcon>
          )}
          <ListItemText primary={item.label} />
        </ListItemButton>
      </ListItem>
    );
  }

  return (
    <>
      <ListItem disablePadding>
        <ListItemButton onClick={() => setOpen((isOpen) => !isOpen)} sx={parentSx}>
          {Icon && (
            <ListItemIcon>
              <Icon />
            </ListItemIcon>
          )}
          <ListItemText primary={item.label} />
          {open ? <ExpandLess fontSize="small" /> : <ExpandMore fontSize="small" />}
        </ListItemButton>
      </ListItem>
      <Collapse in={open} timeout="auto" unmountOnExit>
        <List disablePadding>
          {item.children.map((child) => (
            <NavLeaf key={child.path} to={child.path} label={child.label} sx={childSx} />
          ))}
        </List>
      </Collapse>
    </>
  );
};

// One nav entry: resolves privilege + customer gating, then renders leaf or group.
const NavEntry = ({ item }) => {
  const visible = useHasPrivilege(item.privilege);
  const tabVisible = useTabVisible(item.tabKey);
  const hasCustomer = useSelector(selectHasCustomer);

  // Items without a privilege (e.g. Inicio) are always visible.
  if (item.privilege && !visible) return null;
  // Gating por tab del registry de permisos del backend (tabs[tabKey] !== 'visible' → oculto).
  if (item.tabKey && !tabVisible) return null;

  const locked = item.requiresCustomer && !hasCustomer;

  if (item.children) return <NavGroup item={item} locked={locked} />;

  if (locked) {
    const Icon = ICONS[item.icon];
    return (
      <ListItem disablePadding>
        <ListItemButton disabled sx={itemSx}>
          {Icon && (
            <ListItemIcon>
              <Icon />
            </ListItemIcon>
          )}
          <ListItemText primary={item.label} />
        </ListItemButton>
      </ListItem>
    );
  }

  return <NavLeaf to={item.path} label={item.label} icon={item.icon} />;
};

const Nav = () => {
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);
  const brand = useBrandConfig();
  if (!isAuthenticated) return null;

  return (
    <Drawer
      variant="permanent"
      anchor="left"
      sx={{
        width: DRAWER_WIDTH,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: DRAWER_WIDTH,
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
        },
      }}
    >
      <Toolbar
        sx={{
          px: 2.5,
          py: 1.25,
          flexDirection: 'column',
          alignItems: 'flex-start',
          justifyContent: 'center',
          gap: 0.5,
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Typography
          variant="overline"
          component="div"
          sx={{ color: 'text.disabled', lineHeight: 1.2 }}
        >
          Welcome
        </Typography>
        <Box
          component="img"
          src={brand.logo}
          alt={brand.label}
          sx={{ display: 'block', height: brand.logoHeight, width: 'auto' }}
        />
      </Toolbar>
      <List sx={{ flexGrow: 1, py: 1, overflowY: 'auto' }}>
        {NAV_ITEMS.filter((item) => item.placement !== 'bottom').map((item) => (
          <NavEntry key={item.path || item.label} item={item} />
        ))}
      </List>
      {NAV_ITEMS.some((item) => item.placement === 'bottom') && (
        <>
          <Divider />
          <List
            sx={{ py: 1 }}
            subheader={
              <ListSubheader
                sx={{ bgcolor: 'transparent', lineHeight: 2, color: 'text.disabled', fontSize: '0.7rem' }}
              >
                Global · no requiere cliente
              </ListSubheader>
            }
          >
            {NAV_ITEMS.filter((item) => item.placement === 'bottom').map((item) => (
              <NavEntry key={item.path || item.label} item={item} />
            ))}
          </List>
        </>
      )}
    </Drawer>
  );
};

export default Nav;
