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
  IconButton,
  Tooltip,
  Snackbar,
  Divider,
  Tab,
  Tabs,
} from '@mui/material';
import {
  Home,
  PictureAsPdf,
  PlayCircle,
  Download,
  OpenInNew,
  CheckCircle,
  RadioButtonUnchecked,
  FilterList,
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import axiosInstance from '../../api/axios';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Footer from '../../components/Layout/Footer';

const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

const WeekPage = () => {
  const { subjectId, month, week } = useParams();
  const navigate = useNavigate();

  const [subject, setSubject] = useState(null);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [completedIds, setCompletedIds] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('completed_activities') || '[]');
    } catch {
      return [];
    }
  });
  const [snackbar, setSnackbar] = useState({ open: false, message: '' });
  const [tabValue, setTabValue] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [subjectRes, activitiesRes] = await Promise.all([
          axiosInstance.get(`/subjects/${subjectId}/`),
          axiosInstance.get(`/activities/?subject=${subjectId}&month=${month}&week=${week}`),
        ]);
        setSubject(subjectRes.data);
        setActivities(activitiesRes.data?.results || activitiesRes.data || []);
      } catch (err) {
        setError('Error al cargar las actividades.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [subjectId, month, week]);

  const toggleComplete = (activityId) => {
    const updated = completedIds.includes(activityId)
      ? completedIds.filter((id) => id !== activityId)
      : [...completedIds, activityId];
    setCompletedIds(updated);
    localStorage.setItem('completed_activities', JSON.stringify(updated));
    setSnackbar({
      open: true,
      message: completedIds.includes(activityId) ? 'Marcado como pendiente' : '¡Actividad completada! 🎉',
    });
  };

  if (loading) return <LoadingSpinner message="Cargando actividades..." />;

  const monthName = MONTHS[parseInt(month) - 1] || `Mes ${month}`;

  const allActivities = activities;
  const fichas = activities.filter(
    (a) => a.activity_type === 'ficha' || a.file_url || a.pdf_url
  );
  const videos = activities.filter(
    (a) => a.activity_type === 'video' || a.video_url
  );

  const getFilteredActivities = () => {
    if (tabValue === 1) return fichas.length > 0 ? fichas : activities.filter(a => !a.video_url);
    if (tabValue === 2) return videos.length > 0 ? videos : activities.filter(a => a.video_url);
    return allActivities;
  };

  const filteredActivities = getFilteredActivities();

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
              sx={{ color: 'rgba(255,255,255,0.8)', textDecoration: 'none', fontSize: '0.85rem', '&:hover': { color: '#fff' } }}
            >
              <Home sx={{ fontSize: '0.9rem', mr: 0.3, verticalAlign: 'middle' }} /> Dashboard
            </Link>
            <Link
              component="button"
              onClick={() => navigate(`/subjects/${subjectId}`)}
              sx={{ color: 'rgba(255,255,255,0.8)', textDecoration: 'none', fontSize: '0.85rem', '&:hover': { color: '#fff' } }}
            >
              {subject?.name}
            </Link>
            <Link
              component="button"
              onClick={() => navigate(`/subjects/${subjectId}/month/${month}`)}
              sx={{ color: 'rgba(255,255,255,0.8)', textDecoration: 'none', fontSize: '0.85rem', '&:hover': { color: '#fff' } }}
            >
              {monthName}
            </Link>
            <Typography sx={{ color: '#fff', fontWeight: 600, fontSize: '0.85rem' }}>
              Semana {week}
            </Typography>
          </Breadcrumbs>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box
              sx={{
                background: 'rgba(255,255,255,0.25)',
                borderRadius: '16px',
                p: 1.5,
                fontSize: '2rem',
                display: 'flex',
              }}
            >
              📋
            </Box>
            <Box>
              <Typography variant="h3" fontWeight={800} sx={{ color: '#fff', lineHeight: 1 }}>
                Semana {week} - {monthName}
              </Typography>
              <Typography sx={{ color: 'rgba(255,255,255,0.9)', mt: 0.5 }}>
                {subject?.name} •{' '}
                {activities.length} actividad{activities.length !== 1 ? 'es' : ''}
              </Typography>
            </Box>
          </Box>

          {/* Progress */}
          <Box sx={{ mt: 2, display: 'flex', gap: 2, alignItems: 'center' }}>
            <Chip
              icon={<CheckCircle sx={{ color: '#fff !important', fontSize: '0.9rem !important' }} />}
              label={`${activities.filter((a) => completedIds.includes(a.id)).length} / ${activities.length} completadas`}
              sx={{
                background: 'rgba(255,255,255,0.25)',
                color: '#fff',
                fontWeight: 700,
                backdropFilter: 'blur(10px)',
              }}
            />
          </Box>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 3, borderRadius: '12px' }}>
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
                background: 'linear-gradient(135deg, #1976d2, #42a5f5)',
                color: '#fff !important',
              },
              '& .MuiTabs-indicator': { display: 'none' },
            }}
          >
            <Tab label={`Todos (${activities.length})`} />
            <Tab label={`Fichas (${fichas.length})`} />
            <Tab label={`Videos (${videos.length})`} />
          </Tabs>
        </Box>

        {filteredActivities.length === 0 ? (
          <Box
            sx={{
              textAlign: 'center',
              py: 8,
              background: '#fff',
              borderRadius: '20px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
            }}
          >
            <Typography sx={{ fontSize: '4rem', mb: 2 }}>📭</Typography>
            <Typography variant="h5" fontWeight={700} sx={{ mb: 1 }}>
              No hay actividades aún
            </Typography>
            <Typography color="text.secondary">
              El docente añadirá actividades pronto para esta semana.
            </Typography>
          </Box>
        ) : (
          <Grid container spacing={2.5}>
            {filteredActivities.map((activity) => {
              const isCompleted = completedIds.includes(activity.id);
              const isVideo =
                activity.activity_type === 'video' ||
                activity.video_url ||
                (activity.url && activity.url.includes('youtube'));
              const isFicha = !isVideo;

              return (
                <Grid item xs={12} sm={6} md={4} key={activity.id}>
                  <Card
                    sx={{
                      height: '100%',
                      border: isCompleted ? '2px solid #4caf50' : '2px solid transparent',
                      background: isCompleted
                        ? 'linear-gradient(135deg, #f1f8e9, #dcedc8)'
                        : '#fff',
                      position: 'relative',
                      overflow: 'visible',
                    }}
                  >
                    {isCompleted && (
                      <Box
                        sx={{
                          position: 'absolute',
                          top: -10,
                          right: -10,
                          background: '#4caf50',
                          borderRadius: '50%',
                          width: 28,
                          height: 28,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          boxShadow: '0 2px 8px rgba(76,175,80,0.5)',
                          zIndex: 1,
                        }}
                      >
                        <CheckCircle sx={{ color: '#fff', fontSize: '1.2rem' }} />
                      </Box>
                    )}

                    <CardContent sx={{ p: 2.5 }}>
                      {/* Type badge */}
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                        <Avatar
                          sx={{
                            bgcolor: isVideo ? '#fce4ec' : '#e3f2fd',
                            width: 44,
                            height: 44,
                          }}
                        >
                          {isVideo ? (
                            <PlayCircle sx={{ color: '#e91e63', fontSize: '1.6rem' }} />
                          ) : (
                            <PictureAsPdf sx={{ color: '#1976d2', fontSize: '1.6rem' }} />
                          )}
                        </Avatar>
                        <Box sx={{ flexGrow: 1 }}>
                          <Chip
                            label={isVideo ? 'Video' : 'Ficha PDF'}
                            size="small"
                            sx={{
                              bgcolor: isVideo ? '#fce4ec' : '#e3f2fd',
                              color: isVideo ? '#e91e63' : '#1976d2',
                              fontWeight: 700,
                              fontSize: '0.7rem',
                              height: 20,
                            }}
                          />
                        </Box>
                      </Box>

                      <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 0.5, lineHeight: 1.3 }}>
                        {activity.title}
                      </Typography>

                      {activity.description && (
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
                          {activity.description}
                        </Typography>
                      )}

                      <Divider sx={{ my: 1.5 }} />

                      {/* Action buttons */}
                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        {(activity.file_url || activity.pdf_url || activity.url) && (
                          <Button
                            variant="contained"
                            size="small"
                            startIcon={isVideo ? <PlayCircle /> : <Download />}
                            href={activity.file_url || activity.pdf_url || activity.url}
                            target="_blank"
                            sx={{
                              flex: 1,
                              background: isVideo
                                ? 'linear-gradient(135deg, #e91e63, #f06292)'
                                : 'linear-gradient(135deg, #1976d2, #42a5f5)',
                              fontSize: '0.8rem',
                              py: 0.75,
                            }}
                          >
                            {isVideo ? 'Ver video' : 'Descargar'}
                          </Button>
                        )}

                        {activity.video_url && !activity.file_url && (
                          <Button
                            variant="contained"
                            size="small"
                            startIcon={<PlayCircle />}
                            href={activity.video_url}
                            target="_blank"
                            sx={{
                              flex: 1,
                              background: 'linear-gradient(135deg, #e91e63, #f06292)',
                              fontSize: '0.8rem',
                              py: 0.75,
                            }}
                          >
                            Ver video
                          </Button>
                        )}

                        <Tooltip title={isCompleted ? 'Marcar como pendiente' : 'Marcar como completada'}>
                          <IconButton
                            onClick={() => toggleComplete(activity.id)}
                            size="small"
                            sx={{
                              color: isCompleted ? '#4caf50' : '#9e9e9e',
                              background: isCompleted ? '#e8f5e9' : '#f5f5f5',
                              '&:hover': {
                                background: isCompleted ? '#c8e6c9' : '#eeeeee',
                              },
                            }}
                          >
                            {isCompleted ? (
                              <CheckCircle fontSize="small" />
                            ) : (
                              <RadioButtonUnchecked fontSize="small" />
                            )}
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        )}

        {/* Week navigation */}
        <Box
          sx={{
            mt: 4,
            display: 'flex',
            justifyContent: 'space-between',
            gap: 2,
            flexWrap: 'wrap',
          }}
        >
          {parseInt(week) > 1 && (
            <Button
              variant="outlined"
              onClick={() =>
                navigate(`/subjects/${subjectId}/month/${month}/week/${parseInt(week) - 1}`)
              }
              sx={{ boxShadow: 'none', '&:hover': { boxShadow: 'none', transform: 'none' } }}
            >
              ← Semana anterior
            </Button>
          )}
          {parseInt(week) < 4 && (
            <Button
              variant="contained"
              onClick={() =>
                navigate(`/subjects/${subjectId}/month/${month}/week/${parseInt(week) + 1}`)
              }
              sx={{ ml: 'auto' }}
            >
              Semana siguiente →
            </Button>
          )}
        </Box>
      </Container>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={2500}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        message={snackbar.message}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        ContentProps={{
          sx: { borderRadius: '12px', fontWeight: 600 },
        }}
      />

      <Footer />
    </Box>
  );
};

export default WeekPage;
