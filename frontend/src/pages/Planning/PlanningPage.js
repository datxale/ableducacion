import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Avatar,
  Box,
  Breadcrumbs,
  Button,
  Chip,
  Container,
  Grid,
  Link,
  Paper,
  Typography,
} from '@mui/material';
import {
  CalendarMonth,
  TableChart,
  Download,
  Home,
  Launch,
  PlayCircle,
  Settings,
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
  const [items, setItems] = useState([]);
  const [grades, setGrades] = useState([]);
  const [months, setMonths] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadPageData = async () => {
      setLoading(true);
      setError('');

      const [planningRes, gradesRes, monthsRes] = await Promise.allSettled([
        axiosInstance.get('/planning/', {
          params: isEstudiante && user?.grade_id ? { grade_id: user.grade_id } : undefined,
        }),
        axiosInstance.get('/grades/'),
        axiosInstance.get('/months/'),
      ]);

      const hasCoreError = [planningRes, gradesRes, monthsRes].some((result) => result.status !== 'fulfilled');

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

      if (hasCoreError) {
        setError('Error al cargar la planificacion principal.');
      }

      setLoading(false);
    };

    loadPageData();
  }, [isEstudiante, user?.grade_id]);

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

  const planificadores = visibleItems.filter((item) => item.planning_type === 'planificador');

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
      </Container>

      <Footer />
    </Box>
  );
};

export default PlanningPage;
