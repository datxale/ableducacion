import React, { useEffect, useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Alert,
  Breadcrumbs,
  Link,
  Chip,
  Button,
  Avatar,
  LinearProgress,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Divider,
} from '@mui/material';
import {
  Home,
  BarChart,
  EmojiEvents,
  CheckCircle,
  TrendingUp,
  Star,
  School,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import axiosInstance from '../../api/axios';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Footer from '../../components/Layout/Footer';

const badges = [
  { emoji: '🌟', label: 'Primer logro', desc: 'Completaste tu primera actividad', earned: true },
  { emoji: '📚', label: 'Lector voraz', desc: 'Descargaste 5 fichas', earned: true },
  { emoji: '🎯', label: 'Constante', desc: 'Estudia 7 días seguidos', earned: false },
  { emoji: '🏆', label: 'Campeón', desc: 'Completa el mes', earned: false },
  { emoji: '🚀', label: 'Explorador', desc: 'Visita 3 materias', earned: true },
  { emoji: '🎨', label: 'Creativo', desc: 'Completa actividad de arte', earned: false },
];

const ProgressPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [grades, setGrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Get completed activities from localStorage
  const completedActivities = JSON.parse(
    localStorage.getItem('completed_activities') || '[]'
  );

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axiosInstance.get('/grades/');
        setGrades(res.data?.results || res.data || []);
      } catch (err) {
        setError('Error al cargar datos de progreso.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <LoadingSpinner message="Cargando tu progreso..." />;

  const earnedBadges = badges.filter((b) => b.earned).length;
  const totalBadges = badges.length;
  const completedCount = completedActivities.length;

  const displayName = user?.first_name
    ? `${user.first_name} ${user.last_name || ''}`
    : user?.username;

  return (
    <Box sx={{ background: '#f5f7fa', minHeight: '100vh' }}>
      {/* Header */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #4caf50 0%, #81c784 100%)',
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
          <Breadcrumbs sx={{ mb: 2 }} separator="›">
            <Link
              component="button"
              onClick={() => navigate('/dashboard')}
              sx={{ color: 'rgba(255,255,255,0.8)', textDecoration: 'none', fontSize: '0.9rem', '&:hover': { color: '#fff' } }}
            >
              <Home sx={{ fontSize: '1rem', mr: 0.3, verticalAlign: 'middle' }} /> Dashboard
            </Link>
            <Typography sx={{ color: '#fff', fontWeight: 600, fontSize: '0.9rem' }}>
              Mi Progreso
            </Typography>
          </Breadcrumbs>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar
              sx={{
                bgcolor: 'rgba(255,255,255,0.3)',
                color: '#fff',
                width: 64,
                height: 64,
                fontSize: '1.5rem',
                fontWeight: 700,
                border: '3px solid rgba(255,255,255,0.5)',
              }}
            >
              {displayName?.[0]?.toUpperCase()}
            </Avatar>
            <Box>
              <Typography variant="h3" fontWeight={800} sx={{ color: '#fff', lineHeight: 1 }}>
                Mi Progreso
              </Typography>
              <Typography sx={{ color: 'rgba(255,255,255,0.9)', mt: 0.5 }}>
                {displayName} - ¡Sigue aprendiendo!
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
          {[
            {
              icon: <CheckCircle sx={{ fontSize: '2rem', color: '#4caf50' }} />,
              value: completedCount,
              label: 'Actividades completadas',
              color: '#4caf50',
              bg: 'linear-gradient(135deg, #e8f5e9, #c8e6c9)',
              emoji: '✅',
            },
            {
              icon: <EmojiEvents sx={{ fontSize: '2rem', color: '#ff9800' }} />,
              value: earnedBadges,
              label: `Insignias ganadas (de ${totalBadges})`,
              color: '#ff9800',
              bg: 'linear-gradient(135deg, #fff3e0, #ffe0b2)',
              emoji: '🏆',
            },
            {
              icon: <School sx={{ fontSize: '2rem', color: '#1976d2' }} />,
              value: grades.length,
              label: 'Grados disponibles',
              color: '#1976d2',
              bg: 'linear-gradient(135deg, #e3f2fd, #bbdefb)',
              emoji: '📚',
            },
            {
              icon: <Star sx={{ fontSize: '2rem', color: '#9c27b0' }} />,
              value: Math.round((completedCount / Math.max(1, completedCount + 5)) * 100),
              label: 'Nivel de progreso %',
              color: '#9c27b0',
              bg: 'linear-gradient(135deg, #f3e5f5, #e1bee7)',
              emoji: '⭐',
            },
          ].map((stat, i) => (
            <Grid item xs={6} md={3} key={i}>
              <Card
                sx={{
                  background: stat.bg,
                  borderTop: `4px solid ${stat.color}`,
                  textAlign: 'center',
                }}
              >
                <CardContent sx={{ py: 2.5 }}>
                  <Typography sx={{ fontSize: '2.5rem', mb: 0.5 }}>{stat.emoji}</Typography>
                  <Typography variant="h3" fontWeight={900} sx={{ color: stat.color }}>
                    {stat.value}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" fontWeight={500}>
                    {stat.label}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        <Grid container spacing={3}>
          {/* Overall progress */}
          <Grid item xs={12} md={7}>
            <Paper
              sx={{
                p: 3,
                borderRadius: '20px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.07)',
                mb: 3,
              }}
            >
              <Typography variant="h6" fontWeight={700} sx={{ mb: 3 }}>
                📊 Progreso General
              </Typography>

              <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" fontWeight={600}>
                    Actividades completadas
                  </Typography>
                  <Typography variant="body2" fontWeight={700} color="primary">
                    {completedCount} realizadas
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={Math.min(100, (completedCount / 20) * 100)}
                  sx={{
                    height: 10,
                    borderRadius: 5,
                    bgcolor: '#e3f2fd',
                    '& .MuiLinearProgress-bar': {
                      background: 'linear-gradient(135deg, #1976d2, #42a5f5)',
                      borderRadius: 5,
                    },
                  }}
                />
              </Box>

              <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" fontWeight={600}>
                    Insignias obtenidas
                  </Typography>
                  <Typography variant="body2" fontWeight={700} sx={{ color: '#ff9800' }}>
                    {earnedBadges}/{totalBadges}
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={(earnedBadges / totalBadges) * 100}
                  sx={{
                    height: 10,
                    borderRadius: 5,
                    bgcolor: '#fff3e0',
                    '& .MuiLinearProgress-bar': {
                      background: 'linear-gradient(135deg, #ff9800, #ffd200)',
                      borderRadius: 5,
                    },
                  }}
                />
              </Box>

              {grades.map((grade, index) => (
                <Box key={grade.id} sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography variant="body2" fontWeight={600}>
                      {grade.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {Math.round(Math.random() * 40 + 10)}%
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={Math.round(Math.random() * 40 + 10)}
                    sx={{
                      height: 8,
                      borderRadius: 4,
                      bgcolor: '#f5f5f5',
                      '& .MuiLinearProgress-bar': {
                        background: ['#FF6B6B', '#4ECDC4', '#A770EF', '#f7971e', '#56CCF2', '#6FCF97'][index % 6],
                        borderRadius: 4,
                      },
                    }}
                  />
                </Box>
              ))}
            </Paper>

            {/* Motivational message */}
            <Paper
              sx={{
                p: 3,
                borderRadius: '20px',
                background: 'linear-gradient(135deg, #1976d2, #42a5f5)',
                color: '#fff',
                textAlign: 'center',
              }}
            >
              <Typography sx={{ fontSize: '3rem', mb: 1 }}>💪</Typography>
              <Typography variant="h5" fontWeight={800} sx={{ mb: 1 }}>
                ¡Lo estás haciendo genial!
              </Typography>
              <Typography sx={{ opacity: 0.9, mb: 2 }}>
                Cada día que estudias, eres más inteligente. ¡Sigue así!
              </Typography>
              <Button
                variant="contained"
                onClick={() => navigate('/grades')}
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
                Continuar aprendiendo
              </Button>
            </Paper>
          </Grid>

          {/* Badges */}
          <Grid item xs={12} md={5}>
            <Paper
              sx={{
                p: 3,
                borderRadius: '20px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.07)',
                mb: 3,
              }}
            >
              <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
                🏅 Mis Insignias
              </Typography>
              <Grid container spacing={1.5}>
                {badges.map((badge, i) => (
                  <Grid item xs={4} key={i}>
                    <Box
                      sx={{
                        textAlign: 'center',
                        p: 1.5,
                        borderRadius: '16px',
                        background: badge.earned ? 'linear-gradient(135deg, #fff9c4, #fff176)' : '#f5f5f5',
                        border: badge.earned ? '2px solid #ffd200' : '2px solid #e0e0e0',
                        opacity: badge.earned ? 1 : 0.5,
                        transition: 'all 0.2s ease',
                        '&:hover': badge.earned ? { transform: 'scale(1.05)' } : {},
                      }}
                    >
                      <Typography sx={{ fontSize: '2rem', display: 'block', mb: 0.5 }}>
                        {badge.emoji}
                      </Typography>
                      <Typography
                        variant="caption"
                        fontWeight={700}
                        sx={{
                          display: 'block',
                          fontSize: '0.65rem',
                          color: badge.earned ? '#b8860b' : '#9e9e9e',
                        }}
                      >
                        {badge.label}
                      </Typography>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </Paper>

            {/* Recent activity */}
            <Paper
              sx={{
                p: 3,
                borderRadius: '20px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.07)',
              }}
            >
              <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
                📋 Actividad reciente
              </Typography>
              {completedCount === 0 ? (
                <Box sx={{ textAlign: 'center', py: 3 }}>
                  <Typography sx={{ fontSize: '2rem', mb: 1 }}>📭</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Aún no has completado ninguna actividad.
                  </Typography>
                  <Button
                    variant="contained"
                    size="small"
                    onClick={() => navigate('/grades')}
                    sx={{ mt: 2 }}
                  >
                    Empezar ahora
                  </Button>
                </Box>
              ) : (
                <Box>
                  <Box
                    sx={{
                      p: 2,
                      background: '#e8f5e9',
                      borderRadius: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1.5,
                    }}
                  >
                    <CheckCircle sx={{ color: '#4caf50', fontSize: '1.5rem' }} />
                    <Box>
                      <Typography variant="body2" fontWeight={600}>
                        {completedCount} actividad{completedCount !== 1 ? 'es' : ''} completada{completedCount !== 1 ? 's' : ''}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        ¡Buen trabajo! Sigue así
                      </Typography>
                    </Box>
                  </Box>
                  <Button
                    variant="outlined"
                    fullWidth
                    onClick={() => navigate('/grades')}
                    sx={{ mt: 2, boxShadow: 'none', '&:hover': { boxShadow: 'none', transform: 'none' } }}
                  >
                    Ver más actividades
                  </Button>
                </Box>
              )}
            </Paper>
          </Grid>
        </Grid>
      </Container>

      <Footer />
    </Box>
  );
};

export default ProgressPage;
