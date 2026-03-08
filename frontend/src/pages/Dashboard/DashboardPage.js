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
  Chip,
  Paper,
  LinearProgress,
  Divider,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  School,
  VideoCall,
  BarChart,
  EmojiEvents,
  ArrowForward,
  CalendarMonth,
  PlayCircle,
  MenuBook,
  Star,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import axiosInstance from '../../api/axios';
import GradeCard from '../../components/common/GradeCard';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Footer from '../../components/Layout/Footer';

const greetingByTime = () => {
  const hour = new Date().getHours();
  if (hour < 12) return '¡Buenos días';
  if (hour < 18) return '¡Buenas tardes';
  return '¡Buenas noches';
};

const DashboardPage = () => {
  const { user, isAdmin, isDocente } = useAuth();
  const navigate = useNavigate();

  const [grades, setGrades] = useState([]);
  const [liveClasses, setLiveClasses] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [gradesRes, classesRes] = await Promise.all([
          axiosInstance.get('/grades/'),
          axiosInstance.get('/live-classes/?limit=3'),
        ]);
        setGrades(gradesRes.data?.results || gradesRes.data || []);
        setLiveClasses(classesRes.data?.results || classesRes.data || []);
      } catch (err) {
        setError('Error al cargar datos. Verifica tu conexión.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <LoadingSpinner message="Cargando tu dashboard..." />;

  const displayName = user?.first_name || user?.username || 'Estudiante';
  const roleEmoji = isAdmin ? '⚙️' : isDocente ? '👩‍🏫' : '🎒';

  const quickActions = [
    {
      icon: <School sx={{ fontSize: '2rem', color: '#1976d2' }} />,
      title: 'Mis Grados',
      desc: 'Accede a tus materias',
      color: 'linear-gradient(135deg, #e3f2fd, #bbdefb)',
      border: '#1976d2',
      path: '/grades',
    },
    {
      icon: <VideoCall sx={{ fontSize: '2rem', color: '#e91e63' }} />,
      title: 'Clases en Vivo',
      desc: 'Unirse a clase ahora',
      color: 'linear-gradient(135deg, #fce4ec, #f8bbd9)',
      border: '#e91e63',
      path: '/live-classes',
    },
    {
      icon: <CalendarMonth sx={{ fontSize: '2rem', color: '#ff9800' }} />,
      title: 'Planificación',
      desc: 'Horarios y guías',
      color: 'linear-gradient(135deg, #fff3e0, #ffe0b2)',
      border: '#ff9800',
      path: '/planning',
    },
    {
      icon: <BarChart sx={{ fontSize: '2rem', color: '#4caf50' }} />,
      title: 'Mi Progreso',
      desc: 'Ver mis avances',
      color: 'linear-gradient(135deg, #e8f5e9, #c8e6c9)',
      border: '#4caf50',
      path: '/progress',
    },
  ];

  return (
    <Box sx={{ background: '#f5f7fa', minHeight: '100vh' }}>
      {/* Hero welcome */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #1565c0 0%, #1976d2 60%, #42a5f5 100%)',
          pt: 6,
          pb: 10,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {[...Array(3)].map((_, i) => (
          <Box
            key={i}
            sx={{
              position: 'absolute',
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.07)',
              width: [200, 150, 100][i],
              height: [200, 150, 100][i],
              top: [`${10 + i * 20}%`],
              right: [`${5 + i * 15}%`],
            }}
          />
        ))}
        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
            <Avatar
              sx={{
                width: 60,
                height: 60,
                bgcolor: 'rgba(255,255,255,0.25)',
                color: '#fff',
                fontSize: '1.5rem',
                fontWeight: 700,
                border: '3px solid rgba(255,255,255,0.4)',
              }}
            >
              {displayName[0]?.toUpperCase()}
            </Avatar>
            <Box>
              <Typography
                variant="h4"
                sx={{
                  color: '#fff',
                  fontWeight: 800,
                  fontSize: { xs: '1.5rem', md: '2rem' },
                }}
              >
                {greetingByTime()}, {displayName}! {roleEmoji}
              </Typography>
              <Typography sx={{ color: 'rgba(255,255,255,0.85)', fontSize: '1rem' }}>
                {new Date().toLocaleDateString('es-PE', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </Typography>
            </Box>
          </Box>
          <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Chip
              icon={<Star sx={{ color: '#ffd200 !important' }} />}
              label="¡Sigue aprendiendo!"
              sx={{ background: 'rgba(255,255,255,0.2)', color: '#fff', fontWeight: 600 }}
            />
            {isAdmin && (
              <Chip
                label="Panel Admin"
                onClick={() => navigate('/admin')}
                sx={{
                  background: '#9c27b0',
                  color: '#fff',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              />
            )}
          </Box>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ mt: -4, pb: 6, position: 'relative', zIndex: 1 }}>
        {error && (
          <Alert severity="warning" sx={{ mb: 3, borderRadius: '12px' }}>
            {error}
          </Alert>
        )}

        {/* Quick actions */}
        <Grid container spacing={2} sx={{ mb: 4 }}>
          {quickActions.map((action) => (
            <Grid item xs={6} md={3} key={action.title}>
              <Card
                onClick={() => navigate(action.path)}
                sx={{
                  cursor: 'pointer',
                  background: action.color,
                  borderTop: `4px solid ${action.border}`,
                  height: '100%',
                  '&:hover': { transform: 'translateY(-6px)' },
                }}
              >
                <CardContent sx={{ textAlign: 'center', py: 2.5 }}>
                  {action.icon}
                  <Typography variant="subtitle1" fontWeight={700} sx={{ mt: 1 }}>
                    {action.title}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {action.desc}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        <Grid container spacing={3}>
          {/* Grades section */}
          <Grid item xs={12} lg={8}>
            <Paper
              sx={{
                p: 3,
                borderRadius: '20px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                mb: 3,
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h5" fontWeight={700}>
                  🎒 Mis Grados
                </Typography>
                <Button
                  endIcon={<ArrowForward />}
                  onClick={() => navigate('/grades')}
                  size="small"
                  sx={{ boxShadow: 'none', '&:hover': { boxShadow: 'none', transform: 'none' } }}
                >
                  Ver todos
                </Button>
              </Box>
              {grades.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Typography sx={{ fontSize: '3rem', mb: 1 }}>📚</Typography>
                  <Typography color="text.secondary">No hay grados disponibles aún</Typography>
                </Box>
              ) : (
                <Grid container spacing={2}>
                  {grades.slice(0, 6).map((grade, index) => (
                    <Grid item xs={12} sm={6} md={4} key={grade.id}>
                      <GradeCard grade={grade} index={index} />
                    </Grid>
                  ))}
                </Grid>
              )}
            </Paper>
          </Grid>

          {/* Side panel */}
          <Grid item xs={12} lg={4}>
            {/* Live classes */}
            <Paper
              sx={{
                p: 3,
                borderRadius: '20px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                mb: 3,
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" fontWeight={700}>
                  🎥 Próximas Clases
                </Typography>
                <Button
                  size="small"
                  endIcon={<ArrowForward />}
                  onClick={() => navigate('/live-classes')}
                  sx={{ boxShadow: 'none', '&:hover': { boxShadow: 'none', transform: 'none' } }}
                >
                  Ver todas
                </Button>
              </Box>
              {liveClasses.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 3 }}>
                  <Typography sx={{ fontSize: '2.5rem', mb: 1 }}>📅</Typography>
                  <Typography variant="body2" color="text.secondary">
                    No hay clases programadas
                  </Typography>
                </Box>
              ) : (
                <List disablePadding>
                  {liveClasses.slice(0, 3).map((cls, index) => (
                    <React.Fragment key={cls.id}>
                      <ListItem
                        alignItems="flex-start"
                        sx={{ px: 0, py: 1.5 }}
                        secondaryAction={
                          cls.meeting_url && (
                            <Button
                              size="small"
                              variant="contained"
                              href={cls.meeting_url}
                              target="_blank"
                              sx={{
                                fontSize: '0.7rem',
                                py: 0.5,
                                px: 1.5,
                                minWidth: 'auto',
                              }}
                            >
                              Unirse
                            </Button>
                          )
                        }
                      >
                        <ListItemAvatar>
                          <Avatar
                            sx={{
                              bgcolor: cls.class_type === 'refuerzo' ? '#ff9800' : '#1976d2',
                              width: 36,
                              height: 36,
                            }}
                          >
                            <VideoCall sx={{ fontSize: '1.1rem' }} />
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={
                            <Typography variant="body2" fontWeight={600} noWrap>
                              {cls.title}
                            </Typography>
                          }
                          secondary={
                            <Box>
                              <Typography variant="caption" color="text.secondary" display="block">
                                {cls.date_time
                                  ? new Date(cls.date_time).toLocaleDateString('es-PE', {
                                      day: 'numeric',
                                      month: 'short',
                                      hour: '2-digit',
                                      minute: '2-digit',
                                    })
                                  : 'Sin fecha'}
                              </Typography>
                              {cls.class_type && (
                                <Chip
                                  label={cls.class_type === 'refuerzo' ? 'Refuerzo' : 'Regular'}
                                  size="small"
                                  sx={{
                                    bgcolor: cls.class_type === 'refuerzo' ? '#fff3e0' : '#e3f2fd',
                                    color: cls.class_type === 'refuerzo' ? '#ff9800' : '#1976d2',
                                    fontWeight: 600,
                                    fontSize: '0.6rem',
                                    height: 18,
                                    mt: 0.3,
                                  }}
                                />
                              )}
                            </Box>
                          }
                        />
                      </ListItem>
                      {index < liveClasses.slice(0, 3).length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              )}
            </Paper>

            {/* Progress card */}
            <Paper
              sx={{
                p: 3,
                borderRadius: '20px',
                background: 'linear-gradient(135deg, #4caf50, #81c784)',
                color: '#fff',
                boxShadow: '0 8px 32px rgba(76,175,80,0.35)',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <EmojiEvents sx={{ fontSize: '1.8rem' }} />
                <Typography variant="h6" fontWeight={700}>
                  Mi Progreso
                </Typography>
              </Box>
              <Typography variant="h3" fontWeight={900} sx={{ mb: 0.5 }}>
                🌟
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9, mb: 2 }}>
                ¡Sigue así! Cada día aprendes algo nuevo
              </Typography>
              <Button
                variant="contained"
                fullWidth
                onClick={() => navigate('/progress')}
                sx={{
                  background: 'rgba(255,255,255,0.25)',
                  color: '#fff',
                  fontWeight: 700,
                  boxShadow: 'none',
                  '&:hover': {
                    background: 'rgba(255,255,255,0.4)',
                    boxShadow: 'none',
                    transform: 'none',
                  },
                }}
              >
                Ver mi progreso
              </Button>
            </Paper>
          </Grid>
        </Grid>
      </Container>

      <Footer />
    </Box>
  );
};

export default DashboardPage;
