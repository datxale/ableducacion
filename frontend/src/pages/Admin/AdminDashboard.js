import React, { useEffect, useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Avatar,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Divider,
  Alert,
  Chip,
} from '@mui/material';
import {
  People,
  School,
  VideoCall,
  Activity,
  AdminPanelSettings,
  ArrowForward,
  MenuBook,
  TrendingUp,
  Add,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../api/axios';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Footer from '../../components/Layout/Footer';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    users: 0,
    grades: 0,
    activities: 0,
    liveClasses: 0,
  });
  const [recentUsers, setRecentUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [usersRes, gradesRes, activitiesRes, classesRes] = await Promise.all([
          axiosInstance.get('/users/').catch(() => ({ data: { count: 0, results: [] } })),
          axiosInstance.get('/grades/').catch(() => ({ data: [] })),
          axiosInstance.get('/activities/').catch(() => ({ data: { count: 0 } })),
          axiosInstance.get('/live-classes/').catch(() => ({ data: { count: 0 } })),
        ]);
        setStats({
          users: usersRes.data?.count || (Array.isArray(usersRes.data) ? usersRes.data.length : 0),
          grades: Array.isArray(gradesRes.data) ? gradesRes.data.length : (gradesRes.data?.count || 0),
          activities: activitiesRes.data?.count || (Array.isArray(activitiesRes.data) ? activitiesRes.data.length : 0),
          liveClasses: classesRes.data?.count || (Array.isArray(classesRes.data) ? classesRes.data.length : 0),
        });
        setRecentUsers(usersRes.data?.results?.slice(0, 5) || (Array.isArray(usersRes.data) ? usersRes.data.slice(0, 5) : []));
      } catch (err) {
        setError('Error al cargar datos del panel admin.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <LoadingSpinner message="Cargando panel de administración..." />;

  const adminCards = [
    {
      icon: <People sx={{ fontSize: '2.5rem', color: '#1976d2' }} />,
      title: 'Usuarios',
      value: stats.users,
      desc: 'Estudiantes y docentes',
      color: '#1976d2',
      bg: 'linear-gradient(135deg, #e3f2fd, #bbdefb)',
      path: '/admin/users',
      emoji: '👥',
    },
    {
      icon: <School sx={{ fontSize: '2.5rem', color: '#4caf50' }} />,
      title: 'Grados',
      value: stats.grades,
      desc: 'Grados configurados',
      color: '#4caf50',
      bg: 'linear-gradient(135deg, #e8f5e9, #c8e6c9)',
      path: '/grades',
      emoji: '📚',
    },
    {
      icon: <MenuBook sx={{ fontSize: '2.5rem', color: '#9c27b0' }} />,
      title: 'Actividades',
      value: stats.activities,
      desc: 'Fichas y videos',
      color: '#9c27b0',
      bg: 'linear-gradient(135deg, #f3e5f5, #e1bee7)',
      path: '/admin/activities',
      emoji: '📋',
    },
    {
      icon: <VideoCall sx={{ fontSize: '2.5rem', color: '#e91e63' }} />,
      title: 'Clases en Vivo',
      value: stats.liveClasses,
      desc: 'Sesiones programadas',
      color: '#e91e63',
      bg: 'linear-gradient(135deg, #fce4ec, #f8bbd9)',
      path: '/admin/classes',
      emoji: '🎥',
    },
  ];

  const quickActions = [
    { label: 'Gestionar usuarios', icon: '👥', path: '/admin/users', color: '#1976d2' },
    { label: 'Subir actividades', icon: '📤', path: '/admin/activities', color: '#9c27b0' },
    { label: 'Programar clase', icon: '🎥', path: '/admin/classes', color: '#e91e63' },
    { label: 'Ver grados', icon: '📚', path: '/grades', color: '#4caf50' },
  ];

  return (
    <Box sx={{ background: '#f5f7fa', minHeight: '100vh' }}>
      {/* Header */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #9c27b0 0%, #ba68c8 100%)',
          py: 6,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            top: -30,
            right: -30,
            width: 200,
            height: 200,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.1)',
          }}
        />
        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box
              sx={{
                background: 'rgba(255,255,255,0.25)',
                borderRadius: '16px',
                p: 1.5,
                display: 'flex',
              }}
            >
              <AdminPanelSettings sx={{ color: '#fff', fontSize: '2.5rem' }} />
            </Box>
            <Box>
              <Typography variant="h3" fontWeight={800} sx={{ color: '#fff', lineHeight: 1 }}>
                Panel Admin
              </Typography>
              <Typography sx={{ color: 'rgba(255,255,255,0.9)', mt: 0.5 }}>
                Gestiona todos los recursos de la plataforma
              </Typography>
            </Box>
          </Box>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        {error && (
          <Alert severity="warning" sx={{ mb: 3, borderRadius: '12px' }}>
            {error}
          </Alert>
        )}

        {/* Stats cards */}
        <Grid container spacing={2.5} sx={{ mb: 4 }}>
          {adminCards.map((card) => (
            <Grid item xs={6} md={3} key={card.title}>
              <Card
                onClick={() => navigate(card.path)}
                sx={{
                  cursor: 'pointer',
                  background: card.bg,
                  borderTop: `4px solid ${card.color}`,
                  height: '100%',
                }}
              >
                <CardContent sx={{ textAlign: 'center', py: 3 }}>
                  <Typography sx={{ fontSize: '2.5rem', mb: 0.5 }}>{card.emoji}</Typography>
                  <Typography variant="h3" fontWeight={900} sx={{ color: card.color }}>
                    {card.value}
                  </Typography>
                  <Typography variant="subtitle1" fontWeight={700}>
                    {card.title}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {card.desc}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Quick actions */}
        <Paper
          sx={{
            p: 3,
            borderRadius: '20px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.07)',
            mb: 3,
          }}
        >
          <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
            ⚡ Acciones Rápidas
          </Typography>
          <Grid container spacing={2}>
            {quickActions.map((action) => (
              <Grid item xs={6} sm={3} key={action.label}>
                <Button
                  fullWidth
                  variant="contained"
                  onClick={() => navigate(action.path)}
                  sx={{
                    background: action.color,
                    py: 2,
                    flexDirection: 'column',
                    gap: 0.5,
                    borderRadius: '16px',
                    '&:hover': {
                      background: action.color,
                      filter: 'brightness(0.9)',
                    },
                  }}
                >
                  <Typography sx={{ fontSize: '1.8rem' }}>{action.icon}</Typography>
                  <Typography variant="caption" fontWeight={700}>
                    {action.label}
                  </Typography>
                </Button>
              </Grid>
            ))}
          </Grid>
        </Paper>

        <Grid container spacing={3}>
          {/* Recent users */}
          <Grid item xs={12} md={6}>
            <Paper
              sx={{
                p: 3,
                borderRadius: '20px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.07)',
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" fontWeight={700}>
                  👥 Usuarios recientes
                </Typography>
                <Button
                  size="small"
                  endIcon={<ArrowForward />}
                  onClick={() => navigate('/admin/users')}
                  sx={{ boxShadow: 'none', '&:hover': { boxShadow: 'none', transform: 'none' } }}
                >
                  Ver todos
                </Button>
              </Box>
              {recentUsers.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 3 }}>
                  <Typography sx={{ fontSize: '2rem', mb: 1 }}>👤</Typography>
                  <Typography variant="body2" color="text.secondary">
                    No hay usuarios registrados
                  </Typography>
                </Box>
              ) : (
                <List disablePadding>
                  {recentUsers.map((user, index) => (
                    <React.Fragment key={user.id}>
                      <ListItem sx={{ px: 0 }}>
                        <ListItemAvatar>
                          <Avatar
                            sx={{
                              bgcolor:
                                user.role === 'admin'
                                  ? '#9c27b0'
                                  : user.role === 'docente'
                                  ? '#1976d2'
                                  : '#4caf50',
                              fontWeight: 700,
                            }}
                          >
                            {(user.first_name || user.username)?.[0]?.toUpperCase()}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography variant="body2" fontWeight={600}>
                                {user.first_name
                                  ? `${user.first_name} ${user.last_name || ''}`
                                  : user.username}
                              </Typography>
                              <Chip
                                label={user.role || 'estudiante'}
                                size="small"
                                sx={{
                                  bgcolor:
                                    user.role === 'admin'
                                      ? '#f3e5f5'
                                      : user.role === 'docente'
                                      ? '#e3f2fd'
                                      : '#e8f5e9',
                                  color:
                                    user.role === 'admin'
                                      ? '#9c27b0'
                                      : user.role === 'docente'
                                      ? '#1976d2'
                                      : '#4caf50',
                                  fontWeight: 700,
                                  fontSize: '0.6rem',
                                  height: 18,
                                }}
                              />
                            </Box>
                          }
                          secondary={user.email}
                        />
                      </ListItem>
                      {index < recentUsers.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              )}
            </Paper>
          </Grid>

          {/* Admin nav */}
          <Grid item xs={12} md={6}>
            <Paper
              sx={{
                p: 3,
                borderRadius: '20px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.07)',
              }}
            >
              <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
                ⚙️ Módulos de gestión
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {[
                  {
                    icon: '👥',
                    title: 'Gestión de Usuarios',
                    desc: 'Administra docentes y estudiantes',
                    path: '/admin/users',
                    color: '#1976d2',
                  },
                  {
                    icon: '📋',
                    title: 'Gestión de Actividades',
                    desc: 'Sube fichas y videos educativos',
                    path: '/admin/activities',
                    color: '#9c27b0',
                  },
                  {
                    icon: '🎥',
                    title: 'Gestión de Clases en Vivo',
                    desc: 'Programa sesiones y videollamadas',
                    path: '/admin/classes',
                    color: '#e91e63',
                  },
                ].map((item) => (
                  <Box
                    key={item.path}
                    onClick={() => navigate(item.path)}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 2,
                      p: 2,
                      background: `${item.color}0d`,
                      border: `2px solid ${item.color}22`,
                      borderRadius: '14px',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        background: `${item.color}1a`,
                        border: `2px solid ${item.color}44`,
                        transform: 'translateX(4px)',
                      },
                    }}
                  >
                    <Box
                      sx={{
                        background: `${item.color}22`,
                        borderRadius: '12px',
                        p: 1.5,
                        fontSize: '1.6rem',
                        display: 'flex',
                        alignItems: 'center',
                      }}
                    >
                      {item.icon}
                    </Box>
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography variant="subtitle2" fontWeight={700} sx={{ color: item.color }}>
                        {item.title}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {item.desc}
                      </Typography>
                    </Box>
                    <ArrowForward sx={{ color: item.color, fontSize: '1.1rem' }} />
                  </Box>
                ))}
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </Container>

      <Footer />
    </Box>
  );
};

export default AdminDashboard;
