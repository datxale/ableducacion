import React, { useEffect, useState } from 'react';
import {
  AppBar,
  Avatar,
  Box,
  Button,
  Chip,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Toolbar,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import {
  AdminPanelSettings,
  BarChart,
  CalendarMonth,
  Close,
  Dashboard,
  Logout,
  Menu as MenuIcon,
  School,
  SwapHoriz,
  VideoCall,
} from '@mui/icons-material';
import { useLocation, useNavigate } from 'react-router-dom';

import axiosInstance from '../../api/axios';
import {
  landingPageDefaults,
  mergeLandingPageConfig,
} from '../../constants/landingPageDefaults';
import { useAuth } from '../../context/AuthContext';

const Navbar = () => {
  const { user, logout, isAdmin, isAuthenticated, isImpersonating, stopImpersonation } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [anchorEl, setAnchorEl] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [landingContent, setLandingContent] = useState(landingPageDefaults);

  const handleProfileMenu = (event) => setAnchorEl(event.currentTarget);
  const handleCloseMenu = () => setAnchorEl(null);

  const handleLogout = () => {
    logout();
    navigate('/');
    handleCloseMenu();
    setMobileOpen(false);
  };

  const handleStopImpersonation = () => {
    const result = stopImpersonation();
    if (result.success) {
      navigate('/admin/users');
    }
    handleCloseMenu();
    setMobileOpen(false);
  };

  const handlePublicNavigation = (hash = '') => {
    navigate({
      pathname: '/inicio',
      hash,
    });
    setMobileOpen(false);
  };

  const navItems = [
    { label: 'Dashboard', path: '/dashboard', icon: <Dashboard /> },
    { label: 'Grados', path: '/grades', icon: <School /> },
    { label: 'Planificacion', path: '/planning', icon: <CalendarMonth /> },
    { label: 'Clases en Vivo', path: '/live-classes', icon: <VideoCall /> },
    { label: 'Progreso', path: '/progress', icon: <BarChart /> },
  ];

  if (isAdmin) {
    navItems.push({ label: 'Admin', path: '/admin', icon: <AdminPanelSettings /> });
    navItems.push({ label: 'Espejos', path: '/admin/mirrors', icon: <SwapHoriz /> });
  }

  const roleColor = isAdmin ? '#9c27b0' : user?.role === 'docente' ? '#1976d2' : '#4caf50';
  const roleLabel = isAdmin ? 'Admin' : user?.role === 'docente' ? 'Docente' : 'Estudiante';
  const isLanding = location.pathname === '/' || location.pathname === '/inicio';
  const publicNavItems = [
    { label: landingContent.nav_home_label, hash: '' },
    { label: landingContent.nav_about_label, hash: '#quienes-somos' },
    { label: landingContent.nav_news_label, hash: '#noticias' },
  ];

  useEffect(() => {
    if (isAuthenticated) {
      return undefined;
    }

    let isMounted = true;

    axiosInstance.get('/landing-page/')
      .then((response) => {
        if (isMounted) {
          setLandingContent(mergeLandingPageConfig(response.data));
        }
      })
      .catch(() => {
        if (isMounted) {
          setLandingContent(landingPageDefaults);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [isAuthenticated]);

  const isNavItemActive = (itemPath) => {
    if (itemPath === '/admin') {
      return location.pathname === '/admin';
    }
    return location.pathname.startsWith(itemPath);
  };

  const isPublicNavActive = (hash) => {
    if (location.pathname !== '/inicio' && location.pathname !== '/') {
      return false;
    }
    if (!hash) {
      return !location.hash;
    }
    return location.hash === hash;
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
        <Toolbar
          sx={{
            width: '100%',
            maxWidth: '1200px',
            mx: 'auto',
            px: { xs: 2, sm: 3, md: 4 },
          }}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              cursor: 'pointer',
              flexGrow: { xs: 1, md: 0 },
              mr: { md: 4 },
              px: isLanding && !isAuthenticated ? 1.5 : 0,
              py: isLanding && !isAuthenticated ? 0.8 : 0,
              borderRadius: isLanding && !isAuthenticated ? '20px' : 0,
              background: isLanding && !isAuthenticated ? 'rgba(6,15,35,0.16)' : 'transparent',
              backdropFilter: isLanding && !isAuthenticated ? 'blur(16px)' : 'none',
              border: isLanding && !isAuthenticated ? '1px solid rgba(255,255,255,0.12)' : 'none',
            }}
            onClick={() => navigate(isAuthenticated ? '/dashboard' : '/inicio')}
          >
            <Box
              component="img"
              src="/logo.png"
              alt="ABL Educacion"
              sx={{
                height: { xs: 32, md: 40 },
                width: 'auto',
                filter: isLanding && !isAuthenticated
                  ? 'brightness(0) invert(1) drop-shadow(0 8px 22px rgba(4,10,24,0.35))'
                  : 'brightness(0) invert(1)',
              }}
            />
          </Box>

          {!isAuthenticated && !isMobile && (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                flexGrow: 1,
                p: isLanding ? 0.8 : 0,
                borderRadius: isLanding ? '22px' : 0,
                background: isLanding ? 'rgba(6,15,35,0.14)' : 'transparent',
                backdropFilter: isLanding ? 'blur(18px)' : 'none',
                border: isLanding ? '1px solid rgba(255,255,255,0.12)' : 'none',
                maxWidth: 'fit-content',
              }}
            >
              {publicNavItems.map((item) => (
                <Button
                  key={item.label}
                  onClick={() => handlePublicNavigation(item.hash)}
                  sx={{
                    color: isLanding ? '#fff' : '#1a1a2e',
                    fontWeight: 700,
                    textTransform: 'none',
                    fontSize: '0.95rem',
                    borderRadius: '18px',
                    px: 2.2,
                    py: 1.1,
                    background: isPublicNavActive(item.hash)
                      ? 'rgba(255,255,255,0.16)'
                      : 'transparent',
                    boxShadow: 'none',
                    textShadow: isLanding ? '0 8px 24px rgba(4,10,24,0.35)' : 'none',
                    '&:hover': {
                      background: 'rgba(255,255,255,0.14)',
                      boxShadow: 'none',
                      transform: 'none',
                    },
                  }}
                >
                  {item.label}
                </Button>
              ))}
            </Box>
          )}

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
                    Cerrar Sesion
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
                  background: isLanding ? 'rgba(255,107,107,0.92)' : '#FF6B6B',
                  color: '#fff',
                  fontWeight: 700,
                  borderRadius: '30px',
                  px: 3,
                  py: 1,
                  textTransform: 'none',
                  fontSize: '0.9rem',
                  boxShadow: isLanding
                    ? '0 14px 30px rgba(255,107,107,0.26)'
                    : '0 2px 8px rgba(255,107,107,0.3)',
                  backdropFilter: isLanding ? 'blur(16px)' : 'none',
                  '&:hover': {
                    background: '#e05555',
                    boxShadow: '0 4px 12px rgba(255,107,107,0.4)',
                  },
                }}
              >
                {landingContent.login_button_label}
              </Button>
            )}
          </Box>
        </Toolbar>
      </AppBar>

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

        {isAuthenticated ? (
          <>
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
                  <ListItemText primary="Cerrar Sesion" primaryTypographyProps={{ fontWeight: 600 }} />
                </ListItemButton>
              </ListItem>
            </List>
          </>
        ) : (
          <List>
            {publicNavItems.map((item) => (
              <ListItem key={item.label} disablePadding>
                <ListItemButton
                  onClick={() => handlePublicNavigation(item.hash)}
                  sx={{ borderRadius: '12px', mx: 1, my: 0.25 }}
                >
                  <ListItemText primary={item.label} primaryTypographyProps={{ fontWeight: 600 }} />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        )}
      </Drawer>
    </>
  );
};

export default Navbar;
