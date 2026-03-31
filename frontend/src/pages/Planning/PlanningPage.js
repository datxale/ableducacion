import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Avatar,
  Box,
  Breadcrumbs,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  Link,
  Paper,
  Tab,
  Tabs,
  Typography,
} from '@mui/material';
import {
  CalendarMonth,
  TableChart,
  Download,
  Home,
  Launch,
  MenuBook,
  PlayCircle,
  Refresh,
  Schedule,
  Settings,
  VideoCall,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import axiosInstance from '../../api/axios';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Footer from '../../components/Layout/Footer';
import {
  detectPlanningMediaKind,
  getPlanningTypeMeta,
  getYoutubeEmbedUrl,
} from '../../utils/planning';

const GOOGLE_CALENDAR_URL = 'https://calendar.google.com/calendar/u/0/r/week';
const DEFAULT_CALENDAR_STATUS = {
  google_meet_enabled: false,
  auto_recording_enabled: false,
  calendar_embed_url: '',
  calendar_public_url: GOOGLE_CALENDAR_URL,
};

const getValidDate = (value) => {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const formatDate = (value, options) => {
  const parsed = getValidDate(value);
  if (!parsed) return 'Sin fecha';
  return parsed.toLocaleString('es-PE', options);
};

const getRecordingStatus = (liveClass) => {
  switch (liveClass?.recording_status) {
    case 'available':
      return { label: 'Grabacion disponible', bg: '#e8f5e9', color: '#2e7d32' };
    case 'recording':
      return { label: 'Grabando ahora', bg: '#ffebee', color: '#c62828' };
    case 'processing':
      return { label: 'Procesando grabacion', bg: '#fff8e1', color: '#ef6c00' };
    case 'pending':
      return { label: 'Grabacion pendiente', bg: '#f3e5f5', color: '#7b1fa2' };
    default:
      return null;
  }
};

const PlanningPresentationVideo = ({ url }) => {
  if (!url) return null;

  const mediaKind = detectPlanningMediaKind(url);
  const youtubeUrl = mediaKind === 'youtube' ? getYoutubeEmbedUrl(url) : null;

  return (
    <Paper
      variant="outlined"
      sx={{
        p: 2,
        borderRadius: '20px',
        borderColor: '#dceefb',
        background: 'linear-gradient(180deg, #f9fdff 0%, #ffffff 100%)',
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1.5, flexWrap: 'wrap', mb: 1.5 }}>
        <Box>
          <Typography variant="subtitle1" fontWeight={800} sx={{ color: '#0f4c81' }}>
            Video de presentacion
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Introduccion visual de la unidad para estudiantes y docentes.
          </Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={<PlayCircle />}
          href={url}
          target="_blank"
          rel="noreferrer"
          sx={{ borderColor: '#1976d2', color: '#1976d2' }}
        >
          Abrir video
        </Button>
      </Box>

      {mediaKind === 'youtube' && youtubeUrl && (
        <Box sx={{ position: 'relative', pt: '56.25%', borderRadius: '18px', overflow: 'hidden', background: '#000' }}>
          <Box
            component="iframe"
            src={youtubeUrl}
            title="Video de presentacion"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            sx={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 'none' }}
          />
        </Box>
      )}

      {mediaKind === 'video' && (
        <Box component="video" controls sx={{ width: '100%', borderRadius: '18px', overflow: 'hidden', background: '#000' }}>
          <source src={url} />
          Tu navegador no soporta reproduccion de video.
        </Box>
      )}

      {mediaKind === 'link' && (
        <Alert severity="info" sx={{ borderRadius: '14px' }}>
          El video fue cargado como enlace externo. Usa el boton para abrirlo.
        </Alert>
      )}
    </Paper>
  );
};

const PlanningCard = ({ item, gradeName, monthName }) => (
  <Card sx={{ height: '100%', borderRadius: '20px' }}>
    <CardContent sx={{ p: 2.5 }}>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, mb: 2 }}>
        <Avatar
          sx={{
            bgcolor: item.planning_type === 'horario' ? '#fff3e0' : '#e3f2fd',
            width: 48,
            height: 48,
          }}
        >
          {item.planning_type === 'horario' ? (
            <Schedule sx={{ color: '#f57c00' }} />
          ) : (
            <MenuBook sx={{ color: '#1976d2' }} />
          )}
        </Avatar>
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="subtitle1" fontWeight={700} sx={{ lineHeight: 1.3 }}>
            {item.title}
          </Typography>
          <Box sx={{ display: 'flex', gap: 0.75, mt: 0.75, flexWrap: 'wrap' }}>
            <Chip
              label={item.planning_type === 'horario' ? 'Horario' : 'Guia'}
              size="small"
              sx={{
                bgcolor: item.planning_type === 'horario' ? '#fff3e0' : '#e3f2fd',
                color: item.planning_type === 'horario' ? '#f57c00' : '#1976d2',
                fontWeight: 700,
              }}
            />
            {gradeName && <Chip label={gradeName} size="small" />}
            {monthName && <Chip label={monthName} size="small" />}
            {item.group_name && <Chip label={`Seccion ${item.group_name}`} size="small" />}
          </Box>
        </Box>
      </Box>

      {item.description && (
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{
            mb: 2,
            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {item.description}
        </Typography>
      )}

      <Divider sx={{ mb: 2 }} />

      <Button
        fullWidth
        variant={item.file_url ? 'contained' : 'outlined'}
        startIcon={<Download />}
        href={item.file_url || undefined}
        target={item.file_url ? '_blank' : undefined}
        rel={item.file_url ? 'noreferrer' : undefined}
        disabled={!item.file_url}
      >
        {item.file_url ? 'Descargar recurso' : 'Recurso no disponible'}
      </Button>
    </CardContent>
  </Card>
);

const PlannerUnitCard = ({ item, gradeName, monthName }) => {
  const planningMeta = getPlanningTypeMeta(item.planning_type);
  const totalSessions = (item.structured_content || []).reduce(
    (total, week) => total + (week.days || []).reduce((dayTotal, day) => dayTotal + (day.sessions || []).length, 0),
    0,
  );

  return (
    <Paper
      sx={{
        p: { xs: 2, md: 3 },
        borderRadius: '24px',
        boxShadow: '0 14px 36px rgba(15,23,42,0.08)',
        border: '1px solid #ece7df',
        background: 'linear-gradient(180deg, #fffdf8 0%, #ffffff 100%)',
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap', mb: 2 }}>
        <Box>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 1 }}>
            <Chip
              icon={<TableChart />}
              label={planningMeta.label}
              sx={{ bgcolor: planningMeta.bg, color: planningMeta.color, fontWeight: 800 }}
            />
            {gradeName && <Chip label={gradeName} size="small" />}
            {monthName && <Chip label={monthName} size="small" />}
            {item.group_name && <Chip label={`Seccion ${item.group_name}`} size="small" />}
            {item.unit_number && <Chip label={item.unit_number} size="small" sx={{ fontWeight: 700 }} />}
          </Box>
          <Typography variant="h4" fontWeight={900} sx={{ fontSize: { xs: '1.6rem', md: '2rem' }, color: '#3e2723', mb: 0.75 }}>
            {item.unit_title || item.title}
          </Typography>
          {item.description && (
            <Typography color="text.secondary" sx={{ maxWidth: 920, lineHeight: 1.75 }}>
              {item.description}
            </Typography>
          )}
        </Box>

        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'flex-start' }}>
          <Chip label={`${item.structured_content?.length || 0} semana(s)`} sx={{ fontWeight: 700 }} />
          <Chip label={`${totalSessions} sesiones`} sx={{ fontWeight: 700 }} />
        </Box>
      </Box>

      <Grid container spacing={2} sx={{ mb: 2.5 }}>
        <Grid item xs={12} md={6}>
          <Paper variant="outlined" sx={{ p: 2, borderRadius: '18px', height: '100%', background: '#faf7f2' }}>
            <Typography variant="subtitle2" sx={{ color: '#8d6e63', fontWeight: 800, mb: 1 }}>
              Situacion significativa
            </Typography>
            <Typography sx={{ color: '#5d4037', lineHeight: 1.75 }}>
              {item.situation_context || 'Sin detalle registrado'}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper variant="outlined" sx={{ p: 2, borderRadius: '18px', height: '100%', background: '#f8fbff' }}>
            <Typography variant="subtitle2" sx={{ color: '#1565c0', fontWeight: 800, mb: 1 }}>
              Reto
            </Typography>
            <Typography sx={{ color: '#334155', lineHeight: 1.75 }}>
              {item.learning_challenge || 'Sin reto registrado'}
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2.5 }}>
        {item.source_file_url && (
          <Button
            variant="outlined"
            startIcon={<Launch />}
            href={item.source_file_url}
            target="_blank"
            rel="noreferrer"
            sx={{ borderColor: '#6d4c41', color: '#6d4c41' }}
          >
            Ver PDF fuente
          </Button>
        )}
        {item.file_url && (
          <Button
            variant="outlined"
            startIcon={<Download />}
            href={item.file_url}
            target="_blank"
            rel="noreferrer"
            sx={{ borderColor: '#1565c0', color: '#1565c0' }}
          >
            Recurso adicional
          </Button>
        )}
      </Box>

      {item.presentation_video_url && (
        <Box sx={{ mb: 2.5 }}>
          <PlanningPresentationVideo url={item.presentation_video_url} />
        </Box>
      )}

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {(item.structured_content || []).map((week, weekIndex) => (
          <Paper key={`${item.id}-week-${weekIndex}`} variant="outlined" sx={{ p: 2, borderRadius: '20px', borderColor: '#ede7df' }}>
            <Typography variant="h6" fontWeight={800} sx={{ color: '#4e342e', mb: 1.5 }}>
              {week.title || `Semana ${weekIndex + 1}`}
            </Typography>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))', xl: 'repeat(5, minmax(0, 1fr))' },
                gap: 1.5,
              }}
            >
              {(week.days || []).map((day, dayIndex) => (
                <Paper key={`${item.id}-week-${weekIndex}-day-${dayIndex}`} variant="outlined" sx={{ p: 1.5, borderRadius: '16px', background: '#fffefb' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1, mb: 1, alignItems: 'center' }}>
                    <Typography variant="subtitle2" fontWeight={800} sx={{ color: '#3e2723' }}>
                      {day.day_label}
                    </Typography>
                    {day.date_label && (
                      <Chip label={day.date_label} size="small" sx={{ height: 24, fontWeight: 700 }} />
                    )}
                  </Box>

                  {(day.sessions || []).length === 0 ? (
                    <Typography variant="body2" color="text.secondary">
                      Sin sesiones registradas.
                    </Typography>
                  ) : (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      {(day.sessions || []).map((session, sessionIndex) => (
                        <Paper key={`${item.id}-week-${weekIndex}-day-${dayIndex}-session-${sessionIndex}`} sx={{ p: 1.2, borderRadius: '14px', background: '#f8fafc', boxShadow: 'none' }}>
                          <Typography variant="caption" sx={{ display: 'block', color: '#1565c0', fontWeight: 800, mb: 0.35 }}>
                            {session.subject}
                          </Typography>
                          <Typography variant="body2" sx={{ color: '#334155', lineHeight: 1.5 }}>
                            {session.title}
                          </Typography>
                        </Paper>
                      ))}
                    </Box>
                  )}
                </Paper>
              ))}
            </Box>
          </Paper>
        ))}
      </Box>
    </Paper>
  );
};

const PlanningPage = () => {
  const navigate = useNavigate();
  const { user, isEstudiante, isDocente, isAdmin } = useAuth();
  const [tabValue, setTabValue] = useState(0);
  const [items, setItems] = useState([]);
  const [grades, setGrades] = useState([]);
  const [months, setMonths] = useState([]);
  const [liveClasses, setLiveClasses] = useState([]);
  const [calendarStatus, setCalendarStatus] = useState(DEFAULT_CALENDAR_STATUS);
  const [refreshKey, setRefreshKey] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [recordingDialogOpen, setRecordingDialogOpen] = useState(false);
  const [recordingLoading, setRecordingLoading] = useState(false);
  const [recordingBlobUrl, setRecordingBlobUrl] = useState('');
  const [recordingClass, setRecordingClass] = useState(null);

  const classesManagementPath = isAdmin ? '/admin/classes' : '/teaching/classes';
  const classesPath = isAdmin || isDocente ? classesManagementPath : '/live-classes';

  useEffect(() => () => {
    if (recordingBlobUrl) {
      URL.revokeObjectURL(recordingBlobUrl);
    }
  }, [recordingBlobUrl]);

  useEffect(() => {
    const loadPageData = async () => {
      setLoading(true);
      setError('');

      const liveClassParams =
        isEstudiante && user?.grade_id
          ? { grade_id: user.grade_id }
          : isDocente && user?.id
            ? { teacher_id: user.id }
            : undefined;

      const [planningRes, gradesRes, monthsRes, liveClassesRes, calendarRes] = await Promise.allSettled([
        axiosInstance.get('/planning/', {
          params: isEstudiante && user?.grade_id ? { grade_id: user.grade_id } : undefined,
        }),
        axiosInstance.get('/grades/'),
        axiosInstance.get('/months/'),
        axiosInstance.get('/live-classes/', { params: liveClassParams }),
        axiosInstance.get('/live-classes/config/status'),
      ]);

      const hasCoreError = [planningRes, gradesRes, monthsRes].some((result) => result.status !== 'fulfilled');
      const hasAgendaError = [liveClassesRes, calendarRes].some((result) => result.status !== 'fulfilled');

      if (planningRes.status === 'fulfilled') {
        setItems(planningRes.value.data?.results || planningRes.value.data || []);
      } else {
        setItems([]);
        console.error(planningRes.reason);
      }

      if (gradesRes.status === 'fulfilled') {
        setGrades(gradesRes.value.data?.results || gradesRes.value.data || []);
      } else {
        setGrades([]);
        console.error(gradesRes.reason);
      }

      if (monthsRes.status === 'fulfilled') {
        setMonths(monthsRes.value.data?.results || monthsRes.value.data || []);
      } else {
        setMonths([]);
        console.error(monthsRes.reason);
      }

      if (liveClassesRes.status === 'fulfilled') {
        setLiveClasses(liveClassesRes.value.data?.results || liveClassesRes.value.data || []);
      } else {
        setLiveClasses([]);
        console.error(liveClassesRes.reason);
      }

      if (calendarRes.status === 'fulfilled') {
        setCalendarStatus({ ...DEFAULT_CALENDAR_STATUS, ...(calendarRes.value.data || {}) });
      } else {
        setCalendarStatus(DEFAULT_CALENDAR_STATUS);
        console.error(calendarRes.reason);
      }

      if (hasCoreError) {
        setError('Error al cargar la planificacion principal.');
      } else if (hasAgendaError) {
        setError('La agenda de clases no pudo cargarse por completo, pero el planificador sigue disponible.');
      }

      setLoading(false);
    };

    loadPageData();
  }, [isDocente, isEstudiante, refreshKey, user?.grade_id, user?.id]);

  const gradesById = useMemo(
    () => Object.fromEntries(grades.map((grade) => [grade.id, grade])),
    [grades]
  );

  const monthsById = useMemo(
    () => Object.fromEntries(months.map((month) => [month.id, month])),
    [months]
  );

  const visibleItems = useMemo(() => {
    if (!isEstudiante || !user?.grade_id) {
      return items;
    }

    return items.filter((item) => item.grade_id === user.grade_id);
  }, [isEstudiante, items, user?.grade_id]);

  const agendaItems = useMemo(() => {
    return [...liveClasses]
      .filter((item) => getValidDate(item.scheduled_at))
      .sort((left, right) => getValidDate(left.scheduled_at) - getValidDate(right.scheduled_at));
  }, [liveClasses]);

  const highlightedAgenda = useMemo(() => {
    const now = new Date();
    const currentOrUpcoming = agendaItems.filter((item) => {
      const scheduledAt = getValidDate(item.scheduled_at);
      return scheduledAt && scheduledAt.getTime() >= now.getTime() - 90 * 60 * 1000;
    });

    return (currentOrUpcoming.length > 0 ? currentOrUpcoming : agendaItems).slice(0, 5);
  }, [agendaItems]);

  const planificadores = visibleItems.filter((item) => item.planning_type === 'planificador');
  const horarios = visibleItems.filter((item) => item.planning_type === 'horario');
  const guias = visibleItems.filter((item) => item.planning_type === 'guia');
  const currentItems = tabValue === 0 ? horarios : guias;
  const availableRecordingCount = liveClasses.filter((item) => item.recording_status === 'available').length;
  const pendingRecordingCount = liveClasses.filter(
    (item) => item.recording_status && item.recording_status !== 'available'
  ).length;
  const calendarPublicUrl = calendarStatus.calendar_public_url || GOOGLE_CALENDAR_URL;
  const calendarEmbedUrl = calendarStatus.calendar_embed_url || '';

  const handleOpenRecording = async (liveClass) => {
    setRecordingClass(liveClass);
    setRecordingDialogOpen(true);
    setRecordingLoading(true);

    try {
      const response = await axiosInstance.get(`/live-classes/${liveClass.id}/recording/stream`, {
        responseType: 'blob',
      });
      if (recordingBlobUrl) {
        URL.revokeObjectURL(recordingBlobUrl);
      }
      setRecordingBlobUrl(URL.createObjectURL(response.data));
      setRefreshKey((value) => value + 1);
    } catch (err) {
      setRecordingDialogOpen(false);
      setError(err.response?.data?.detail || 'No se pudo abrir la grabacion.');
    } finally {
      setRecordingLoading(false);
    }
  };

  const closeRecordingDialog = () => {
    setRecordingDialogOpen(false);
    setRecordingLoading(false);
    setRecordingClass(null);
    if (recordingBlobUrl) {
      URL.revokeObjectURL(recordingBlobUrl);
      setRecordingBlobUrl('');
    }
  };

  if (loading) return <LoadingSpinner message="Cargando planificacion..." />;

  return (
    <Box sx={{ background: '#f5f7fa', minHeight: '100vh' }}>
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
          <Breadcrumbs sx={{ mb: 2 }} separator=">">
            <Link
              component="button"
              onClick={() => navigate('/dashboard')}
              sx={{
                color: 'rgba(255,255,255,0.8)',
                textDecoration: 'none',
                fontSize: '0.9rem',
                '&:hover': { color: '#fff' },
              }}
            >
              <Home sx={{ fontSize: '1rem', mr: 0.3, verticalAlign: 'middle' }} /> Dashboard
            </Link>
            <Typography sx={{ color: '#fff', fontWeight: 600, fontSize: '0.9rem' }}>
              Planificacion
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
                Planificacion
              </Typography>
              <Typography sx={{ color: 'rgba(255,255,255,0.9)', mt: 0.5 }}>
                Planificadores por unidad, recursos pedagógicos y agenda de clases en vivo
              </Typography>
            </Box>
          </Box>

          {(isDocente || isAdmin) && (
            <Button
              variant="contained"
              startIcon={<Settings />}
              onClick={() => navigate('/planning/manage')}
              sx={{ mt: 3, background: '#5d4037', '&:hover': { background: '#3e2723' } }}
            >
              Gestionar planificacion
            </Button>
          )}
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        {error && (
          <Alert severity="warning" sx={{ mb: 3, borderRadius: '12px' }}>
            {error}
          </Alert>
        )}

        <Paper
          sx={{
            p: 3,
            mb: 3,
            borderRadius: '24px',
            background: 'linear-gradient(180deg, #fffdf8 0%, #ffffff 100%)',
            border: '1px solid #f0e6d9',
            boxShadow: '0 18px 50px rgba(78, 52, 46, 0.08)',
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap', alignItems: 'center', mb: 2.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Avatar sx={{ bgcolor: '#6d4c41', width: 52, height: 52 }}>
                <TableChart />
              </Avatar>
              <Box>
                <Typography variant="h5" fontWeight={800}>
                  Planificador pedagogico
                </Typography>
                <Typography color="text.secondary">
                  Esta seccion replica la estructura curricular por unidad, semanas, dias y sesiones, tal como se plantea en el planificador academico.
                </Typography>
              </Box>
            </Box>

            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Chip label={`${planificadores.length} unidad${planificadores.length === 1 ? '' : 'es'} publicada${planificadores.length === 1 ? '' : 's'}`} sx={{ fontWeight: 700 }} />
              {isAdmin || isDocente ? (
                <Button
                  variant="contained"
                  startIcon={<Settings />}
                  onClick={() => navigate('/planning/manage')}
                  sx={{ background: '#6d4c41', '&:hover': { background: '#5d4037' } }}
                >
                  Gestionar planificadores
                </Button>
              ) : null}
            </Box>
          </Box>

          {planificadores.length === 0 ? (
            <Paper variant="outlined" sx={{ p: 4, borderRadius: '20px', textAlign: 'center', background: '#fff' }}>
              <Typography variant="h6" fontWeight={700} sx={{ mb: 1 }}>
                Aun no hay planificadores publicados
              </Typography>
              <Typography color="text.secondary">
                Cuando se publique una unidad, aqui veras la situacion significativa, el reto y la matriz semanal de sesiones.
              </Typography>
            </Paper>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {planificadores.map((item) => (
                <PlannerUnitCard
                  key={item.id}
                  item={item}
                  gradeName={gradesById[item.grade_id]?.name}
                  monthName={item.month_id ? monthsById[item.month_id]?.name : null}
                />
              ))}
            </Box>
          )}
        </Paper>

        <Paper
          sx={{
            p: 3,
            mb: 3,
            borderRadius: '24px',
            background: 'linear-gradient(135deg, #ffffff 0%, #fdf2ff 100%)',
            border: '1px solid #f3e5f5',
            boxShadow: '0 18px 50px rgba(84, 27, 94, 0.08)',
          }}
        >
          <Grid container spacing={3}>
            <Grid item xs={12} md={5}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                <Avatar sx={{ bgcolor: '#6a1b9a', width: 52, height: 52 }}>
                  <CalendarMonth />
                </Avatar>
                <Box>
                  <Typography variant="h5" fontWeight={800}>
                    Agenda de clases en vivo
                  </Typography>
                  <Typography color="text.secondary">
                    Google Calendar queda como agenda sincronizada de Meet, Drive y clases en vivo, separada del planificador pedagogico.
                  </Typography>
                </Box>
              </Box>

              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                <Chip
                  label={calendarStatus.google_meet_enabled ? 'Google Meet activo' : 'Google Meet inactivo'}
                  sx={{
                    bgcolor: calendarStatus.google_meet_enabled ? '#e8f5e9' : '#fff3e0',
                    color: calendarStatus.google_meet_enabled ? '#2e7d32' : '#ef6c00',
                    fontWeight: 700,
                  }}
                />
                <Chip
                  label={`${liveClasses.length} clase${liveClasses.length === 1 ? '' : 's'} sincronizada${liveClasses.length === 1 ? '' : 's'}`}
                  sx={{ bgcolor: '#e3f2fd', color: '#1565c0', fontWeight: 700 }}
                />
                <Chip
                  label={`${availableRecordingCount} grabacion${availableRecordingCount === 1 ? '' : 'es'} disponible${availableRecordingCount === 1 ? '' : 's'}`}
                  sx={{ bgcolor: '#e8f5e9', color: '#2e7d32', fontWeight: 700 }}
                />
                <Chip
                  label={`${pendingRecordingCount} pendiente${pendingRecordingCount === 1 ? '' : 's'} de Drive`}
                  sx={{ bgcolor: '#f3e5f5', color: '#7b1fa2', fontWeight: 700 }}
                />
              </Box>

              <Typography color="text.secondary" sx={{ mb: 2 }}>
                Flujo real: el docente programa la clase, Google Calendar crea el evento, Meet genera la reunion,
                Drive procesa la grabacion y luego el video queda disponible dentro de la plataforma.
              </Typography>

              <Alert
                severity={calendarStatus.google_meet_enabled ? 'success' : 'info'}
                sx={{ mb: 2, borderRadius: '14px' }}
              >
                {calendarStatus.google_meet_enabled
                  ? calendarStatus.auto_recording_enabled
                    ? 'La integracion de Google ya esta operativa y la sincronizacion de grabaciones se revisa automaticamente.'
                    : 'La integracion con Google Meet esta activa, pero la auto grabacion esta deshabilitada.'
                  : 'La agenda de Google todavia no esta activa en este servidor.'}
              </Alert>

              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <Button
                  variant="contained"
                  startIcon={<VideoCall />}
                  onClick={() => navigate(classesPath)}
                  sx={{ background: '#6a1b9a', '&:hover': { background: '#4a148c' } }}
                >
                  {isAdmin || isDocente ? 'Gestionar clases' : 'Ver clases'}
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<Launch />}
                  href={calendarPublicUrl}
                  target="_blank"
                  rel="noreferrer"
                  sx={{ borderColor: '#6a1b9a', color: '#6a1b9a' }}
                >
                  Abrir Google Calendar
                </Button>
                <Button
                  variant="text"
                  startIcon={<Refresh />}
                  onClick={() => setRefreshKey((value) => value + 1)}
                  sx={{ color: '#6a1b9a' }}
                >
                  Actualizar agenda
                </Button>
              </Box>
            </Grid>

            <Grid item xs={12} md={7}>
              <Paper
                variant="outlined"
                sx={{
                  height: '100%',
                  borderRadius: '20px',
                  p: 2,
                  borderColor: '#ede7f6',
                  background: '#fff',
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1, mb: 2 }}>
                  <Typography variant="h6" fontWeight={800}>
                    Agenda sincronizada
                  </Typography>
                  <Chip
                    label={highlightedAgenda.length > 0 ? 'Vista desde Planificacion' : 'Sin clases programadas'}
                    size="small"
                    sx={{ bgcolor: '#f5f5f5', color: '#555', fontWeight: 700 }}
                  />
                </Box>

                {highlightedAgenda.length === 0 ? (
                  <Box
                    sx={{
                      minHeight: 240,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      textAlign: 'center',
                      px: 2,
                    }}
                  >
                    <Box>
                      <Typography variant="h6" fontWeight={700} sx={{ mb: 1 }}>
                        Aun no hay clases en el calendario
                      </Typography>
                      <Typography color="text.secondary" sx={{ mb: 2 }}>
                        Cuando programes una clase con Google Meet, aparecera aqui como parte de la agenda.
                      </Typography>
                      {(isAdmin || isDocente) && (
                        <Button variant="contained" onClick={() => navigate(classesManagementPath)}>
                          Crear primera clase
                        </Button>
                      )}
                    </Box>
                  </Box>
                ) : (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
                    {highlightedAgenda.map((liveClass) => {
                      const recordingStatus = getRecordingStatus(liveClass);
                      const canShowRecording = Boolean(
                        liveClass.recording_status === 'available' || liveClass.recording_file_id || liveClass.recording_url
                      );

                      return (
                        <Paper
                          key={liveClass.id}
                          variant="outlined"
                          sx={{
                            p: 2,
                            borderRadius: '18px',
                            borderColor: '#ede7f6',
                            background: liveClass.meeting_provider === 'google_meet' ? '#fcf7ff' : '#fff',
                          }}
                        >
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, mb: 1.25, flexWrap: 'wrap' }}>
                            <Box>
                              <Typography fontWeight={800}>{liveClass.title}</Typography>
                              <Typography variant="body2" color="text.secondary">
                                {liveClass.subject?.name || 'Clase en vivo'} -{' '}
                                {liveClass.grade?.name || `Grado ${liveClass.grade_id}`}
                              </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap' }}>
                              {liveClass.meeting_provider === 'google_meet' && (
                                <Chip
                                  label="Google Meet"
                                  size="small"
                                  sx={{ bgcolor: '#e8eaf6', color: '#3949ab', fontWeight: 700 }}
                                />
                              )}
                              {recordingStatus && (
                                <Chip
                                  label={recordingStatus.label}
                                  size="small"
                                  sx={{
                                    bgcolor: recordingStatus.bg,
                                    color: recordingStatus.color,
                                    fontWeight: 700,
                                  }}
                                />
                              )}
                            </Box>
                          </Box>

                          <Typography variant="body2" color="text.secondary" sx={{ mb: 1.25 }}>
                            {formatDate(liveClass.scheduled_at, {
                              weekday: 'long',
                              day: 'numeric',
                              month: 'long',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </Typography>

                          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                            <Button
                              size="small"
                              variant="contained"
                              startIcon={<VideoCall />}
                              onClick={() => navigate('/live-classes')}
                              sx={{ background: '#6a1b9a', '&:hover': { background: '#4a148c' } }}
                            >
                              Abrir en plataforma
                            </Button>
                            {liveClass.meeting_url && (
                              <Button
                                size="small"
                                variant="outlined"
                                startIcon={<Launch />}
                                href={liveClass.meeting_url}
                                target="_blank"
                                rel="noreferrer"
                                sx={{ borderColor: '#6a1b9a', color: '#6a1b9a' }}
                              >
                                Abrir Meet
                              </Button>
                            )}
                            {canShowRecording && (
                              <Button
                                size="small"
                                variant="outlined"
                                startIcon={<PlayCircle />}
                                onClick={() => handleOpenRecording(liveClass)}
                                sx={{ borderColor: '#2e7d32', color: '#2e7d32' }}
                              >
                                Ver grabacion
                              </Button>
                            )}
                          </Box>
                        </Paper>
                      );
                    })}
                  </Box>
                )}
              </Paper>
            </Grid>
          </Grid>

          <Divider sx={{ my: 3 }} />

          <Paper
            variant="outlined"
            sx={{
              borderRadius: '22px',
              p: 2,
              borderColor: '#ede7f6',
              background: '#fff',
            }}
          >
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: 2,
                mb: 2,
                flexWrap: 'wrap',
              }}
            >
              <Box>
                <Typography variant="h6" fontWeight={800}>
                  Vista Google Calendar
                </Typography>
                <Typography color="text.secondary">
                  Esta es la agenda de la cuenta conectada en Google. Si no carga, abre el calendario en otra pestana o inicia sesion en Google.
                </Typography>
              </Box>
              <Chip
                label={calendarEmbedUrl ? 'Calendario embebido activo' : 'Usa el acceso directo'}
                sx={{
                  bgcolor: calendarEmbedUrl ? '#e8f5e9' : '#fff3e0',
                  color: calendarEmbedUrl ? '#2e7d32' : '#ef6c00',
                  fontWeight: 700,
                }}
              />
            </Box>

            {calendarEmbedUrl ? (
              <Box
                sx={{
                  borderRadius: '18px',
                  overflow: 'hidden',
                  border: '1px solid #ede7f6',
                  background: '#fff',
                  height: { xs: 520, md: 640 },
                }}
              >
                <Box
                  component="iframe"
                  title="Google Calendar embebido"
                  src={calendarEmbedUrl}
                  sx={{ width: '100%', height: '100%', border: 0, display: 'block' }}
                  allowFullScreen
                />
              </Box>
            ) : (
              <Alert severity="info" sx={{ borderRadius: '14px' }}>
                El iframe del calendario no esta disponible todavia. Puedes abrir Google Calendar desde el acceso directo mientras se completa esa configuracion.
              </Alert>
            )}
          </Paper>
        </Paper>

        {(isDocente || isAdmin) && (
          <Paper
            sx={{
              p: 2.5,
              mb: 3,
              borderRadius: '20px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 2,
              flexWrap: 'wrap',
              background: 'linear-gradient(135deg, #fff3e0, #ffffff)',
              border: '1px solid #ffe0b2',
            }}
          >
            <Box>
              <Typography variant="h6" fontWeight={700} sx={{ mb: 0.5 }}>
                Crear y publicar planificacion
              </Typography>
              <Typography color="text.secondary">
                Desde aqui gestionas planificadores por unidad, horarios y guias. Las clases que deben ir a Google Calendar se programan aparte desde Gestionar clases.
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Button
                variant="contained"
                startIcon={<TableChart />}
                onClick={() => navigate('/planning/manage')}
                sx={{ background: '#6d4c41', '&:hover': { background: '#5d4037' } }}
              >
                Nuevo planificador
              </Button>
              <Button
                variant="outlined"
                startIcon={<MenuBook />}
                onClick={() => navigate('/planning/manage')}
                sx={{ borderColor: '#6d4c41', color: '#6d4c41' }}
              >
                Ver recursos
              </Button>
            </Box>
          </Paper>
        )}

        <Paper
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
            onChange={(_, value) => setTabValue(value)}
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
            <Tab label={`Horarios (${horarios.length})`} />
            <Tab label={`Guias (${guias.length})`} />
          </Tabs>
        </Paper>

        {currentItems.length === 0 ? (
          <Paper
            sx={{
              p: 6,
              textAlign: 'center',
              borderRadius: '20px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
            }}
          >
            <Typography variant="h5" fontWeight={700} sx={{ mb: 1 }}>
              No hay {tabValue === 0 ? 'horarios' : 'guias'} disponibles
            </Typography>
            <Typography color="text.secondary">
              {isEstudiante && user?.grade_id
                ? 'Todavia no hay recursos publicados para tu grado.'
                : 'Todavia no hay recursos publicados en esta categoria.'}
            </Typography>
            {(isDocente || isAdmin) && (
              <Button
                variant="contained"
                startIcon={<Settings />}
                onClick={() => navigate('/planning/manage')}
                sx={{ mt: 3, background: '#ef6c00', '&:hover': { background: '#e65100' } }}
              >
                Publicar primer recurso
              </Button>
            )}
          </Paper>
        ) : (
          <Grid container spacing={2.5}>
            {currentItems.map((item) => (
              <Grid item xs={12} sm={6} md={4} key={item.id}>
                <PlanningCard
                  item={item}
                  gradeName={gradesById[item.grade_id]?.name}
                  monthName={item.month_id ? monthsById[item.month_id]?.name : null}
                />
              </Grid>
            ))}
          </Grid>
        )}
      </Container>

      <Dialog open={recordingDialogOpen} onClose={closeRecordingDialog} maxWidth="md" fullWidth>
        <DialogTitle>{recordingClass ? `Grabacion: ${recordingClass.title}` : 'Grabacion de clase'}</DialogTitle>
        <DialogContent>
          {recordingLoading ? (
            <Box sx={{ py: 4, textAlign: 'center' }}>
              <CircularProgress />
            </Box>
          ) : recordingBlobUrl ? (
            <Box
              component="video"
              src={recordingBlobUrl}
              controls
              sx={{ width: '100%', borderRadius: '12px', background: '#000', minHeight: 360 }}
            />
          ) : (
            <Alert severity="info" sx={{ mt: 1 }}>
              La grabacion aun no esta disponible.
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={closeRecordingDialog}>Cerrar</Button>
        </DialogActions>
      </Dialog>

      <Footer />
    </Box>
  );
};

export default PlanningPage;
