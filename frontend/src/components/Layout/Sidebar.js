import React from 'react';
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Box,
  Typography,
  Avatar,
  Chip,
  Divider,
} from '@mui/material';
import {
  Dashboard,
  School,
  VideoCall,
  BarChart,
  AdminPanelSettings,
  CalendarMonth,
  MenuBook,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  getUserDisplayName,
  getUserInitial,
  getUserRoleColor,
  getUserRoleLabel,
} from '../../utils/users';

const DRAWER_WIDTH = 260;

const Sidebar = ({ open, onClose, variant = 'temporary' }) => {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { label: 'Dashboard', path: '/dashboard', icon: <Dashboard />, color: '#1976d2' },
    { label: 'Grados', path: '/grades', icon: <School />, color: '#4caf50' },
    { label: 'Planificacion', path: '/planning', icon: <CalendarMonth />, color: '#ff9800' },
    { label: 'Clases en Vivo', path: '/live-classes', icon: <VideoCall />, color: '#e91e63' },
    { label: 'Mi Progreso', path: '/progress', icon: <BarChart />, color: '#9c27b0' },
  ];

  if (isAdmin) {
    navItems.push({ label: 'Administracion', path: '/admin', icon: <AdminPanelSettings />, color: '#f44336' });
  }

  const roleColor = getUserRoleColor(user);
  const roleLabel = isAdmin ? 'Administrador' : getUserRoleLabel(user);
  const displayName = getUserDisplayName(user);

  const drawerContent = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <Box
        sx={{
          p: 3,
          background: 'linear-gradient(135deg, #1565c0 0%, #42a5f5 100%)',
          color: '#fff',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Box
            sx={{
              background: 'rgba(255,255,255,0.2)',
              borderRadius: '10px',
              p: '6px',
              mr: 1,
            }}
          >
            <MenuBook sx={{ color: '#fff', fontSize: '1.5rem' }} />
          </Box>
          <Typography variant="h6" fontWeight={800}>
            ABL Educacion
          </Typography>
        </Box>

        {/* User info */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Avatar
            sx={{
              bgcolor: 'rgba(255,255,255,0.25)',
              color: '#fff',
              fontWeight: 700,
              width: 44,
              height: 44,
            }}
          >
            {getUserInitial(user)}
          </Avatar>
          <Box>
            <Typography variant="subtitle2" fontWeight={700} sx={{ lineHeight: 1.2 }}>
              {displayName}
            </Typography>
            <Chip
              label={roleLabel}
              size="small"
              sx={{
                bgcolor: roleColor,
                color: '#fff',
                fontWeight: 700,
                fontSize: '0.65rem',
                height: 20,
                mt: 0.5,
              }}
            />
          </Box>
        </Box>
      </Box>

      <Divider />

      {/* Navigation */}
      <List sx={{ p: 1.5, flexGrow: 1 }}>
        {navItems.map((item) => {
          const isActive = location.pathname.startsWith(item.path);
          return (
            <ListItem key={item.path} disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                onClick={() => {
                  navigate(item.path);
                  if (variant === 'temporary') onClose?.();
                }}
                sx={{
                  borderRadius: '12px',
                  background: isActive
                    ? `linear-gradient(135deg, ${item.color}22, ${item.color}11)`
                    : 'transparent',
                  borderLeft: isActive ? `4px solid ${item.color}` : '4px solid transparent',
                  '&:hover': {
                    background: `${item.color}11`,
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    color: isActive ? item.color : 'text.secondary',
                    minWidth: 40,
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.label}
                  primaryTypographyProps={{
                    fontWeight: isActive ? 700 : 500,
                    color: isActive ? item.color : 'text.primary',
                    fontSize: '0.9rem',
                  }}
                />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>

      {/* Footer */}
      <Box sx={{ p: 2, borderTop: '1px solid #f0f0f0' }}>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: 'center' }}>
          © {new Date().getFullYear()} ABL Educacion
        </Typography>
      </Box>
    </Box>
  );

  if (variant === 'permanent') {
    return (
      <Drawer
        variant="permanent"
        sx={{
          width: DRAWER_WIDTH,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: DRAWER_WIDTH,
            boxSizing: 'border-box',
            border: 'none',
            boxShadow: '4px 0 20px rgba(0,0,0,0.08)',
          },
        }}
      >
        {drawerContent}
      </Drawer>
    );
  }

  return (
    <Drawer
      anchor="left"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: DRAWER_WIDTH,
          borderRadius: '0 16px 16px 0',
        },
      }}
    >
      {drawerContent}
    </Drawer>
  );
};

export default Sidebar;
