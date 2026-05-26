import { NavLink } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
} from '@mui/material';
import Home from '@mui/icons-material/Home';
import People from '@mui/icons-material/People';
import Subscriptions from '@mui/icons-material/Subscriptions';
import Receipt from '@mui/icons-material/Receipt';
import { NAV_ITEMS } from '@/common/router/nav.config';
import { useHasRoles } from '@/common/roles/useHasRoles';
import { selectHasCustomer } from '@/common/features/customer/customerSlice';

const DRAWER_WIDTH = 240;

const ICONS = {
  Home,
  People,
  Subscriptions,
  Receipt,
};

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
    '& .MuiListItemIcon-root': {
      color: 'secondary.main',
    },
    '& .MuiListItemText-primary': {
      fontWeight: 600,
    },
    '&::before': {
      content: '""',
      position: 'absolute',
      left: -10,
      top: 8,
      bottom: 8,
      width: 3,
      borderRadius: 2,
      backgroundColor: 'secondary.main',
    },
  },
};

const NavListItem = ({ item }) => {
  const Icon = ICONS[item.icon];
  const visible = useHasRoles(item.allowedRoles);
  const hasCustomer = useSelector(selectHasCustomer);
  if (!visible) return null;

  const disabled = item.requiresCustomer && !hasCustomer;

  if (disabled) {
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
    <ListItem disablePadding>
      <ListItemButton component={NavLink} to={item.path} end sx={itemSx}>
        {Icon && (
          <ListItemIcon>
            <Icon />
          </ListItemIcon>
        )}
        <ListItemText primary={item.label} />
      </ListItemButton>
    </ListItem>
  );
};

const Nav = () => {
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);
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
      <Toolbar sx={{ px: 2.5, borderBottom: '1px solid', borderColor: 'divider' }}>
        <Typography
          variant="h5"
          noWrap
          component="div"
          sx={{ fontWeight: 700, color: 'text.primary', letterSpacing: '-0.02em' }}
        >
          Backoffice
          <Box component="span" sx={{ color: 'secondary.main', ml: 0.75 }}>
            Godó
          </Box>
        </Typography>
      </Toolbar>
      <List sx={{ flexGrow: 1, py: 1 }}>
        {NAV_ITEMS.map((item) => (
          <NavListItem key={item.path} item={item} />
        ))}
      </List>
    </Drawer>
  );
};

export default Nav;
