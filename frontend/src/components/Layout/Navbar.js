import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Box,
  Avatar,
  Menu,
  MenuItem,
  Divider,
  Chip,
  useMediaQuery,
  useTheme,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemButton,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard,
  School,
  VideoCall,
  BarChart,
  AdminPanelSettings,
  SwapHoriz,
  Logout,
  CalendarMonth,
  Close,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Navbar = () => {
  const { user, logout, isAdmin, isAuthenticated, isImpersonating, stopImpersonation } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [anchorEl, setAnchorEl] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleProfileMenu = (event) => setAnchorEl(event.currentTarget);
  const handleCloseMenu = () => setAnchorEl(null);

  const handleLogout = () => {
    logout();
    navigate('/');
    handleCloseMenu();
  };

  const handleStopImpersonation = () => {
    const result = stopImpersonation();
    if (result.success) {
      navigate('/admin/users');
    }
    handleCloseMenu();
    setMobileOpen(false);
  };

  const navItems = [
    { label: 'Dashboard', path: '/dashboard', icon: <Dashboard /> },
    { label: 'Grados', path: '/grades', icon: <School /> },
    { label: 'Planificación', path: '/planning', icon: <CalendarMonth /> },
    { label: 'Clases en Vivo', path: '/live-classes', icon: <VideoCall /> },
    { label: 'Progreso', path: '/progress', icon: <BarChart /> },
  ];

  if (isAdmin) {
    navItems.push({ label: 'Admin', path: '/admin', icon: <AdminPanelSettings /> });
    navItems.push({ label: 'Espejos', path: '/admin/mirrors', icon: <SwapHoriz /> });
  }

  const roleColor = isAdmin ? '#9c27b0' : user?.role === 'docente' ? '#1976d2' : '#4caf50';
  const roleLabel = isAdmin ? 'Admin' : user?.role === 'docente' ? 'Docente' : 'Estudiante';

  const isLanding = location.pathname === '/';
  const isNavItemActive = (itemPath) => {
    if (itemPath === '/admin') {
      return location.pathname === '/admin';
    }
    return location.pathname.startsWith(itemPath);
  };

  return (
    <>
      <AppBar
        position={isLanding && !isAuthenticated ? 'absolute' : 'sticky'}
        elevation={0}
        sx={{
          background:
            isLanding && !isAuthenticated
              ? 'transparent'
              : 'linear-gradient(135deg, #1565c0 0%, #1976d2 50%, #42a5f5 100%)',
          borderBottom: isLanding && !isAuthenticated ? 'none' : '1px solid rgba(255,255,255,0.1)',
          zIndex: theme.zIndex.drawer + 1,
          boxShadow: 'none',
        }}
      >
        <Toolbar sx={{ px: { xs: 2, md: 4 } }}>
          {/* Logo */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              cursor: 'pointer',
              flexGrow: { xs: 1, md: 0 },
              mr: { md: 4 },
            }}
            onClick={() => navigate(isAuthenticated ? '/dashboard' : '/')}
          >
            <Box
              component="img"
              src={isLanding && !isAuthenticated ? '/logo.png' : '/logo.png'}
              alt="ABL Educación"
              sx={{
                height: { xs: 32, md: 40 },
                width: 'auto',
                filter: isLanding && !isAuthenticated ? 'none' : 'brightness(0) invert(1)',
              }}
            />
          </Box>

          {/* Public nav items (landing page) */}
          {!isAuthenticated && !isMobile && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexGrow: 1 }}>
              <Button
                onClick={() => navigate('/')}
                sx={{
                  color: '#1a1a2e',
                  fontWeight: 600,
                  textTransform: 'none',
                  fontSize: '0.9rem',
                  boxShadow: 'none',
                  '&:hover': {
                    background: 'rgba(0,0,0,0.05)',
                    boxShadow: 'none',
                    transform: 'none',
                  },
                }}
              >
                Inicio
              </Button>
              <Button
                sx={{
                  color: '#1a1a2e',
                  fontWeight: 600,
                  textTransform: 'none',
                  fontSize: '0.9rem',
                  boxShadow: 'none',
                  '&:hover': {
                    background: 'rgba(0,0,0,0.05)',
                    boxShadow: 'none',
                    transform: 'none',
                  },
                }}
              >
                Centro de Ayuda
              </Button>
            </Box>
          )}

          {/* Authenticated desktop nav */}
          {isAuthenticated && !isMobile && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexGrow: 1 }}>
              {navItems.map((item) => (
                <Button
                  key={item.path}
                  startIcon={item.icon}
                  onClick={() => navigate(item.path)}
                  sx={{
                    color: '#fff',
                    px: 1.5,
                    py: 1,
                    borderRadius: '10px',
                    fontSize: '0.85rem',
                    fontWeight: isNavItemActive(item.path) ? 800 : 600,
                    background: isNavItemActive(item.path)
                      ? 'rgba(255,255,255,0.25)'
                      : 'transparent',
                    boxShadow: 'none',
                    transform: 'none',
                    '&:hover': {
                      transform: 'none',
                      background: 'rgba(255,255,255,0.2)',
                      boxShadow: 'none',
                    },
                  }}
                >
                  {item.label}
                </Button>
              ))}
            </Box>
          )}

          {/* Right side */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: 'auto' }}>
            {isAuthenticated ? (
              <>
                {!isMobile && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                    <Chip
                      label={roleLabel}
                      size="small"
                      sx={{
                        background: roleColor,
                        color: '#fff',
                        fontWeight: 700,
                        fontSize: '0.75rem',
                      }}
                    />
                    {isImpersonating && (
                      <Chip
                        label="Impersonando"
                        size="small"
                        sx={{
                          background: '#ff9800',
                          color: '#fff',
                          fontWeight: 700,
                          fontSize: '0.75rem',
                        }}
                      />
                    )}
                  </Box>
                )}
                <IconButton onClick={handleProfileMenu} sx={{ p: 0.5 }}>
                  <Avatar
                    sx={{
                      bgcolor: 'rgba(255,255,255,0.3)',
                      color: '#fff',
                      width: 40,
                      height: 40,
                      fontWeight: 700,
                      fontSize: '1rem',
                      border: '2px solid rgba(255,255,255,0.5)',
                    }}
                  >
                    {user?.first_name?.[0] || user?.username?.[0] || 'U'}
                  </Avatar>
                </IconButton>
                <Menu
                  anchorEl={anchorEl}
                  open={Boolean(anchorEl)}
                  onClose={handleCloseMenu}
                  transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                  anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                  PaperProps={{
                    elevation: 8,
                    sx: { mt: 1, minWidth: 200, borderRadius: '16px' },
                  }}
                >
                  <Box sx={{ px: 2, py: 1.5 }}>
                    <Typography variant="subtitle1" fontWeight={700}>
                      {user?.first_name
                        ? `${user.first_name} ${user.last_name || ''}`
                        : user?.username}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {user?.email}
                    </Typography>
                  </Box>
                  <Divider />
                  <MenuItem onClick={() => { navigate('/dashboard'); handleCloseMenu(); }}>
                    <ListItemIcon><Dashboard fontSize="small" /></ListItemIcon>
                    Dashboard
                  </MenuItem>
                  {isImpersonating && (
                    <MenuItem onClick={handleStopImpersonation}>
                      <ListItemIcon><AdminPanelSettings fontSize="small" /></ListItemIcon>
                      Volver a Admin
                    </MenuItem>
                  )}
                  <Divider />
                  <MenuItem onClick={handleLogout} sx={{ color: 'error.main' }}>
                    <ListItemIcon><Logout fontSize="small" color="error" /></ListItemIcon>
                    Cerrar Sesión
                  </MenuItem>
                </Menu>

                {isMobile && (
                  <IconButton
                    onClick={() => setMobileOpen(true)}
                    sx={{ color: '#fff', ml: 0.5 }}
                  >
                    <MenuIcon />
                  </IconButton>
                )}
              </>
            ) : (
              <Button
                variant="contained"
                onClick={() => navigate('/login')}
                sx={{
                  background: '#FF6B6B',
                  color: '#fff',
                  fontWeight: 700,
                  borderRadius: '30px',
                  px: 3,
                  py: 1,
                  textTransform: 'none',
                  fontSize: '0.9rem',
                  boxShadow: '0 2px 8px rgba(255,107,107,0.3)',
                  '&:hover': {
                    background: '#e05555',
                    boxShadow: '0 4px 12px rgba(255,107,107,0.4)',
                  },
                }}
              >
                Portal Docente
              </Button>
            )}
          </Box>
        </Toolbar>
      </AppBar>

      {/* Mobile Drawer */}
      <Drawer
        anchor="right"
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        PaperProps={{
          sx: { width: 280, borderRadius: '16px 0 0 16px' },
        }}
      >
        <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" fontWeight={700} color="primary">
            Menu
          </Typography>
          <IconButton onClick={() => setMobileOpen(false)}>
            <Close />
          </IconButton>
        </Box>
        <Divider />
        <Box sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
            <Avatar sx={{ bgcolor: 'primary.main', fontWeight: 700 }}>
              {user?.first_name?.[0] || user?.username?.[0] || 'U'}
            </Avatar>
            <Box>
              <Typography variant="subtitle2" fontWeight={700}>
                {user?.first_name ? `${user.first_name} ${user.last_name || ''}` : user?.username}
              </Typography>
              <Chip label={roleLabel} size="small" sx={{ bgcolor: roleColor, color: '#fff', fontWeight: 700, fontSize: '0.7rem' }} />
            </Box>
          </Box>
        </Box>
        <Divider />
        <List>
          {navItems.map((item) => (
            <ListItem key={item.path} disablePadding>
              <ListItemButton
                onClick={() => { navigate(item.path); setMobileOpen(false); }}
                selected={isNavItemActive(item.path)}
                sx={{
                  borderRadius: '12px',
                  mx: 1,
                  my: 0.25,
                  '&.Mui-selected': {
                    background: 'linear-gradient(135deg, #1976d2, #42a5f5)',
                    color: '#fff',
                    '& .MuiListItemIcon-root': { color: '#fff' },
                  },
                }}
              >
                <ListItemIcon>{item.icon}</ListItemIcon>
                <ListItemText primary={item.label} primaryTypographyProps={{ fontWeight: 600 }} />
              </ListItemButton>
            </ListItem>
          ))}
          {isImpersonating && (
            <ListItem disablePadding>
              <ListItemButton
                onClick={handleStopImpersonation}
                sx={{ borderRadius: '12px', mx: 1, my: 0.25 }}
              >
                <ListItemIcon><AdminPanelSettings color="warning" /></ListItemIcon>
                <ListItemText primary="Volver a Admin" primaryTypographyProps={{ fontWeight: 600 }} />
              </ListItemButton>
            </ListItem>
          )}
          <Divider sx={{ my: 1 }} />
          <ListItem disablePadding>
            <ListItemButton
              onClick={() => { handleLogout(); setMobileOpen(false); }}
              sx={{ borderRadius: '12px', mx: 1, color: 'error.main' }}
            >
              <ListItemIcon><Logout color="error" /></ListItemIcon>
              <ListItemText primary="Cerrar Sesión" primaryTypographyProps={{ fontWeight: 600 }} />
            </ListItemButton>
          </ListItem>
        </List>
      </Drawer>
    </>
  );
};

export default Navbar;
