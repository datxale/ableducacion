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
  Tabs,
  Tab,
  Avatar,
  Divider,
  Paper,
} from '@mui/material';
import {
  Home,
  CalendarMonth,
  Download,
  PictureAsPdf,
  Schedule,
  MenuBook,
  OpenInNew,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../api/axios';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Footer from '../../components/Layout/Footer';

const DAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];
const dayColors = ['#1976d2', '#e91e63', '#9c27b0', '#ff9800', '#4caf50'];

const PlanningPage = () => {
  const navigate = useNavigate();
  const [tabValue, setTabValue] = useState(0);
  const [schedules, setSchedules] = useState([]);
  const [guides, setGuides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [schedulesRes, guidesRes] = await Promise.all([
          axiosInstance.get('/schedules/').catch(() => ({ data: [] })),
          axiosInstance.get('/guides/').catch(() => ({ data: [] })),
        ]);
        setSchedules(schedulesRes.data?.results || schedulesRes.data || []);
        setGuides(guidesRes.data?.results || guidesRes.data || []);
      } catch (err) {
        setError('Error al cargar la planificación.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <LoadingSpinner message="Cargando planificación..." />;

  // Group schedule by day
  const scheduleByDay = DAYS.reduce((acc, day) => {
    acc[day] = schedules.filter(
      (s) => s.day?.toLowerCase() === day.toLowerCase() || s.day_of_week === day
    );
    return acc;
  }, {});

  return (
    <Box sx={{ background: '#f5f7fa', minHeight: '100vh' }}>
      {/* Header */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #ff9800 0%, #f57c00 100%)',
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
              Planificación
            </Typography>
          </Breadcrumbs>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box
              sx={{
                background: 'rgba(255,255,255,0.25)',
                borderRadius: '16px',
                p: 1.5,
                display: 'flex',
              }}
            >
              <CalendarMonth sx={{ color: '#fff', fontSize: '2.5rem' }} />
            </Box>
            <Box>
              <Typography variant="h3" fontWeight={800} sx={{ color: '#fff', lineHeight: 1 }}>
                Planificación
              </Typography>
              <Typography sx={{ color: 'rgba(255,255,255,0.9)', mt: 0.5 }}>
                Horarios semanales y guías de aprendizaje
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
              },
              '& .Mui-selected': {
                background: 'linear-gradient(135deg, #ff9800, #ffd200)',
                color: '#fff !important',
              },
              '& .MuiTabs-indicator': { display: 'none' },
            }}
          >
            <Tab label="📅 Horario Semanal" />
            <Tab label="📚 Guías de Aprendizaje" />
          </Tabs>
        </Box>

        {/* Horario tab */}
        {tabValue === 0 && (
          <Box>
            <Typography variant="h6" fontWeight={700} sx={{ mb: 3 }}>
              Horario de clases semanal
            </Typography>

            {schedules.length === 0 ? (
              <Paper
                sx={{
                  p: 6,
                  textAlign: 'center',
                  borderRadius: '20px',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
                }}
              >
                <Typography sx={{ fontSize: '4rem', mb: 2 }}>📅</Typography>
                <Typography variant="h5" fontWeight={700} sx={{ mb: 1 }}>
                  Sin horario disponible
                </Typography>
                <Typography color="text.secondary">
                  El administrador publicará el horario pronto.
                </Typography>
              </Paper>
            ) : (
              <Grid container spacing={2}>
                {DAYS.map((day, index) => {
                  const daySchedule = scheduleByDay[day];
                  const color = dayColors[index];
                  return (
                    <Grid item xs={12} sm={6} md={4} lg={2.4} key={day}>
                      <Card
                        sx={{
                          height: '100%',
                          borderTop: `4px solid ${color}`,
                          background: `${color}08`,
                        }}
                      >
                        <CardContent>
                          <Box
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 1,
                              mb: 2,
                            }}
                          >
                            <Avatar
                              sx={{
                                bgcolor: color,
                                width: 32,
                                height: 32,
                                fontSize: '0.8rem',
                                fontWeight: 700,
                              }}
                            >
                              {day.substring(0, 2).toUpperCase()}
                            </Avatar>
                            <Typography variant="subtitle1" fontWeight={700} sx={{ color }}>
                              {day}
                            </Typography>
                          </Box>

                          {daySchedule.length === 0 ? (
                            <Typography variant="caption" color="text.secondary">
                              Sin clases
                            </Typography>
                          ) : (
                            daySchedule.map((item, i) => (
                              <Box
                                key={i}
                                sx={{
                                  p: 1.5,
                                  background: '#fff',
                                  borderRadius: '10px',
                                  mb: 1,
                                  border: `1px solid ${color}33`,
                                }}
                              >
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                  <Schedule sx={{ fontSize: '0.9rem', color }} />
                                  <Typography variant="caption" fontWeight={600} sx={{ color }}>
                                    {item.start_time} - {item.end_time}
                                  </Typography>
                                </Box>
                                <Typography variant="body2" fontWeight={600}>
                                  {item.subject_name || item.title}
                                </Typography>
                                {item.teacher && (
                                  <Typography variant="caption" color="text.secondary">
                                    {item.teacher}
                                  </Typography>
                                )}
                              </Box>
                            ))
                          )}
                        </CardContent>
                      </Card>
                    </Grid>
                  );
                })}
              </Grid>
            )}
          </Box>
        )}

        {/* Guides tab */}
        {tabValue === 1 && (
          <Box>
            <Typography variant="h6" fontWeight={700} sx={{ mb: 3 }}>
              Guías y materiales de apoyo
            </Typography>

            {guides.length === 0 ? (
              <Paper
                sx={{
                  p: 6,
                  textAlign: 'center',
                  borderRadius: '20px',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
                }}
              >
                <Typography sx={{ fontSize: '4rem', mb: 2 }}>📚</Typography>
                <Typography variant="h5" fontWeight={700} sx={{ mb: 1 }}>
                  Sin guías disponibles
                </Typography>
                <Typography color="text.secondary">
                  Las guías de aprendizaje serán publicadas pronto.
                </Typography>
              </Paper>
            ) : (
              <Grid container spacing={2.5}>
                {guides.map((guide, index) => (
                  <Grid item xs={12} sm={6} md={4} key={guide.id}>
                    <Card sx={{ height: '100%' }}>
                      <CardContent sx={{ p: 2.5 }}>
                        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, mb: 2 }}>
                          <Avatar
                            sx={{
                              bgcolor: '#e3f2fd',
                              width: 48,
                              height: 48,
                            }}
                          >
                            <MenuBook sx={{ color: '#1976d2' }} />
                          </Avatar>
                          <Box sx={{ flexGrow: 1 }}>
                            <Typography variant="subtitle1" fontWeight={700} sx={{ lineHeight: 1.3 }}>
                              {guide.title}
                            </Typography>
                            {guide.grade_name && (
                              <Chip
                                label={guide.grade_name}
                                size="small"
                                sx={{ bgcolor: '#e3f2fd', color: '#1976d2', fontWeight: 600, mt: 0.5, fontSize: '0.7rem', height: 20 }}
                              />
                            )}
                          </Box>
                        </Box>

                        {guide.description && (
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
                            {guide.description}
                          </Typography>
                        )}

                        <Divider sx={{ mb: 2 }} />

                        <Box sx={{ display: 'flex', gap: 1 }}>
                          {guide.file_url && (
                            <Button
                              variant="contained"
                              size="small"
                              startIcon={<Download />}
                              href={guide.file_url}
                              target="_blank"
                              sx={{ flex: 1, fontSize: '0.8rem' }}
                            >
                              Descargar
                            </Button>
                          )}
                          {guide.url && (
                            <Button
                              variant="outlined"
                              size="small"
                              startIcon={<OpenInNew />}
                              href={guide.url}
                              target="_blank"
                              sx={{ flex: 1, fontSize: '0.8rem', boxShadow: 'none', '&:hover': { boxShadow: 'none', transform: 'none' } }}
                            >
                              Ver
                            </Button>
                          )}
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
          </Box>
        )}
      </Container>

      <Footer />
    </Box>
  );
};

export default PlanningPage;
