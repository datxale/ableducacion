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
  Tabs,
  Tab,
  Divider,
  Paper,
  Badge,
} from '@mui/material';
import {
  Home,
  VideoCall,
  Schedule,
  Person,
  OpenInNew,
  Refresh,
  CalendarToday,
  PlayCircle,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../api/axios';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Footer from '../../components/Layout/Footer';

const LiveClassesPage = () => {
  const navigate = useNavigate();
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tabValue, setTabValue] = useState(0);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const fetchClasses = async () => {
      setLoading(true);
      try {
        const res = await axiosInstance.get('/live-classes/');
        setClasses(res.data?.results || res.data || []);
      } catch (err) {
        setError('Error al cargar las clases. Intenta de nuevo.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchClasses();
  }, [refreshKey]);

  if (loading) return <LoadingSpinner message="Cargando clases en vivo..." />;

  const now = new Date();

  const upcomingClasses = classes.filter((c) => {
    if (!c.date_time) return true;
    return new Date(c.date_time) >= now;
  });

  const pastClasses = classes.filter((c) => {
    if (!c.date_time) return false;
    return new Date(c.date_time) < now;
  });

  const regularClasses = classes.filter((c) => c.class_type !== 'refuerzo');
  const refuerzoClasses = classes.filter((c) => c.class_type === 'refuerzo');

  const getFilteredClasses = () => {
    if (tabValue === 0) return upcomingClasses;
    if (tabValue === 1) return regularClasses;
    if (tabValue === 2) return refuerzoClasses;
    return pastClasses;
  };

  const isLive = (dateTime) => {
    if (!dateTime) return false;
    const classTime = new Date(dateTime);
    const diff = Math.abs(now - classTime) / 60000; // minutes
    return diff <= 60;
  };

  const ClassCard = ({ cls }) => {
    const live = isLive(cls.date_time);
    const isRefuerzo = cls.class_type === 'refuerzo';

    return (
      <Card
        sx={{
          height: '100%',
          border: live ? '2px solid #4caf50' : isRefuerzo ? '2px solid #ff9800' : '2px solid transparent',
          background: live
            ? 'linear-gradient(135deg, #f1f8e9, #dcedc8)'
            : isRefuerzo
            ? 'linear-gradient(135deg, #fff3e0, #ffe0b2)'
            : '#fff',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {live && (
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              background: '#4caf50',
              py: 0.5,
              textAlign: 'center',
            }}
          >
            <Typography variant="caption" sx={{ color: '#fff', fontWeight: 700 }}>
              🔴 EN VIVO AHORA
            </Typography>
          </Box>
        )}
        <CardContent sx={{ p: 2.5, pt: live ? 4 : 2.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, mb: 2 }}>
            <Avatar
              sx={{
                bgcolor: live ? '#4caf50' : isRefuerzo ? '#ff9800' : '#1976d2',
                width: 48,
                height: 48,
              }}
            >
              <VideoCall />
            </Avatar>
            <Box sx={{ flexGrow: 1 }}>
              <Box sx={{ display: 'flex', gap: 0.5, mb: 0.5, flexWrap: 'wrap' }}>
                <Chip
                  label={isRefuerzo ? '🔄 Refuerzo' : '📚 Regular'}
                  size="small"
                  sx={{
                    bgcolor: isRefuerzo ? '#fff3e0' : '#e3f2fd',
                    color: isRefuerzo ? '#f57c00' : '#1565c0',
                    fontWeight: 700,
                    fontSize: '0.65rem',
                    height: 20,
                  }}
                />
                {live && (
                  <Chip
                    label="En Vivo"
                    size="small"
                    sx={{
                      bgcolor: '#4caf50',
                      color: '#fff',
                      fontWeight: 700,
                      fontSize: '0.65rem',
                      height: 20,
                      animation: 'pulse 1.5s ease-in-out infinite',
                      '@keyframes pulse': {
                        '0%, 100%': { opacity: 1 },
                        '50%': { opacity: 0.6 },
                      },
                    }}
                  />
                )}
              </Box>
              <Typography variant="subtitle1" fontWeight={700} sx={{ lineHeight: 1.3 }}>
                {cls.title}
              </Typography>
            </Box>
          </Box>

          {cls.description && (
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                mb: 2,
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}
            >
              {cls.description}
            </Typography>
          )}

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75, mb: 2 }}>
            {cls.date_time && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CalendarToday sx={{ fontSize: '0.9rem', color: 'text.secondary' }} />
                <Typography variant="caption" color="text.secondary" fontWeight={500}>
                  {new Date(cls.date_time).toLocaleDateString('es-PE', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </Typography>
              </Box>
            )}
            {cls.date_time && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Schedule sx={{ fontSize: '0.9rem', color: 'text.secondary' }} />
                <Typography variant="caption" color="text.secondary" fontWeight={500}>
                  {new Date(cls.date_time).toLocaleTimeString('es-PE', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Typography>
              </Box>
            )}
            {(cls.teacher || cls.teacher_name) && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Person sx={{ fontSize: '0.9rem', color: 'text.secondary' }} />
                <Typography variant="caption" color="text.secondary" fontWeight={500}>
                  {cls.teacher_name || cls.teacher}
                </Typography>
              </Box>
            )}
            {cls.grade_name && (
              <Chip
                label={cls.grade_name}
                size="small"
                sx={{ bgcolor: '#f5f5f5', color: '#555', fontWeight: 600, fontSize: '0.7rem', alignSelf: 'flex-start', height: 20 }}
              />
            )}
          </Box>

          <Divider sx={{ mb: 2 }} />

          {cls.meeting_url ? (
            <Button
              variant="contained"
              fullWidth
              startIcon={live ? <PlayCircle /> : <VideoCall />}
              href={cls.meeting_url}
              target="_blank"
              sx={{
                background: live
                  ? 'linear-gradient(135deg, #4caf50, #81c784)'
                  : isRefuerzo
                  ? 'linear-gradient(135deg, #ff9800, #ffd200)'
                  : 'linear-gradient(135deg, #1976d2, #42a5f5)',
                py: 1,
                fontWeight: 700,
              }}
            >
              {live ? '¡Entrar ahora!' : 'Unirse a la clase'}
            </Button>
          ) : (
            <Button
              variant="outlined"
              fullWidth
              disabled
              sx={{ py: 1 }}
            >
              Enlace no disponible
            </Button>
          )}
        </CardContent>
      </Card>
    );
  };

  const filteredClasses = getFilteredClasses();

  return (
    <Box sx={{ background: '#f5f7fa', minHeight: '100vh' }}>
      {/* Header */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #e91e63 0%, #f48fb1 100%)',
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
              Clases en Vivo
            </Typography>
          </Breadcrumbs>

          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box
                sx={{
                  background: 'rgba(255,255,255,0.25)',
                  borderRadius: '16px',
                  p: 1.5,
                  display: 'flex',
                }}
              >
                <VideoCall sx={{ color: '#fff', fontSize: '2.5rem' }} />
              </Box>
              <Box>
                <Typography variant="h3" fontWeight={800} sx={{ color: '#fff', lineHeight: 1 }}>
                  Clases en Vivo
                </Typography>
                <Typography sx={{ color: 'rgba(255,255,255,0.9)', mt: 0.5 }}>
                  Sesiones en tiempo real con tus docentes
                </Typography>
              </Box>
            </Box>
            <Button
              variant="outlined"
              startIcon={<Refresh />}
              onClick={() => setRefreshKey((k) => k + 1)}
              sx={{
                color: '#fff',
                borderColor: 'rgba(255,255,255,0.6)',
                boxShadow: 'none',
                '&:hover': { boxShadow: 'none', transform: 'none', borderColor: '#fff', background: 'rgba(255,255,255,0.1)' },
              }}
            >
              Actualizar
            </Button>
          </Box>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 3, borderRadius: '12px' }}>
            {error}
          </Alert>
        )}

        {/* Stats */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          {[
            { icon: '🎥', label: 'Total de clases', value: classes.length, color: '#e91e63' },
            { icon: '📅', label: 'Próximas', value: upcomingClasses.length, color: '#1976d2' },
            { icon: '🔄', label: 'Refuerzo', value: refuerzoClasses.length, color: '#ff9800' },
            { icon: '✅', label: 'Pasadas', value: pastClasses.length, color: '#4caf50' },
          ].map((stat) => (
            <Grid item xs={6} md={3} key={stat.label}>
              <Paper
                sx={{
                  p: 2,
                  textAlign: 'center',
                  borderRadius: '16px',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
                  border: `2px solid ${stat.color}22`,
                }}
              >
                <Typography sx={{ fontSize: '1.8rem', mb: 0.5 }}>{stat.icon}</Typography>
                <Typography variant="h4" fontWeight={800} sx={{ color: stat.color }}>
                  {stat.value}
                </Typography>
                <Typography variant="caption" color="text.secondary" fontWeight={500}>
                  {stat.label}
                </Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>

        {/* Tabs */}
        <Box
          sx={{
            background: '#fff',
            borderRadius: '16px',
            p: 1,
            mb: 3,
            display: 'inline-flex',
            boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
          }}
        >
          <Tabs
            value={tabValue}
            onChange={(e, v) => setTabValue(v)}
            sx={{
              '& .MuiTab-root': {
                borderRadius: '10px',
                fontWeight: 600,
                minHeight: 36,
                py: 0.5,
                fontSize: '0.85rem',
              },
              '& .Mui-selected': {
                background: 'linear-gradient(135deg, #e91e63, #f48fb1)',
                color: '#fff !important',
              },
              '& .MuiTabs-indicator': { display: 'none' },
            }}
          >
            <Tab label={`Próximas (${upcomingClasses.length})`} />
            <Tab label={`Regular (${regularClasses.length})`} />
            <Tab label={`Refuerzo (${refuerzoClasses.length})`} />
            <Tab label={`Pasadas (${pastClasses.length})`} />
          </Tabs>
        </Box>

        {filteredClasses.length === 0 ? (
          <Paper
            sx={{
              p: 6,
              textAlign: 'center',
              borderRadius: '20px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
            }}
          >
            <Typography sx={{ fontSize: '4rem', mb: 2 }}>📭</Typography>
            <Typography variant="h5" fontWeight={700} sx={{ mb: 1 }}>
              No hay clases en esta categoría
            </Typography>
            <Typography color="text.secondary">
              Las clases serán programadas y publicadas pronto.
            </Typography>
          </Paper>
        ) : (
          <Grid container spacing={2.5}>
            {filteredClasses.map((cls) => (
              <Grid item xs={12} sm={6} md={4} key={cls.id}>
                <ClassCard cls={cls} />
              </Grid>
            ))}
          </Grid>
        )}
      </Container>

      <Footer />
    </Box>
  );
};

export default LiveClassesPage;
