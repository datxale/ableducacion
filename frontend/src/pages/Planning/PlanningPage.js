import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Avatar,
  Box,
  Breadcrumbs,
  Button,
  Card,
  CardActionArea,
  Chip,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  Grid,
  IconButton,
  InputAdornment,
  Link,
  MenuItem,
  Pagination,
  Paper,
  TextField,
  Typography,
} from '@mui/material';
import {
  CalendarMonth,
  Close,
  Delete,
  Download,
  DriveFileRenameOutline,
  Edit,
  Home,
  Launch,
  PlayCircle,
  Search,
  Settings,
  TableChart,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

import axiosInstance from '../../api/axios';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Footer from '../../components/Layout/Footer';
import { useAuth } from '../../context/AuthContext';
import {
  detectPlanningMediaKind,
  getPlanningTypeMeta,
  getYoutubeEmbedUrl,
} from '../../utils/planning';

const PAGE_SIZE = 20;

const toNullableNumber = (value) => {
  if (value === '' || value === null || value === undefined) {
    return null;
  }

  return Number(value);
};

const getTotalSessions = (item) => (
  (item.structured_content || []).reduce(
    (total, week) => total + (week.days || []).reduce((dayTotal, day) => dayTotal + (day.sessions || []).length, 0),
    0,
  )
);

const buildPlanningPayload = (item, overrides = {}) => ({
  planning_type: overrides.planning_type ?? item.planning_type,
  title: overrides.title ?? item.title ?? '',
  description: overrides.description ?? item.description ?? null,
  file_url: overrides.file_url ?? item.file_url ?? null,
  source_file_url: overrides.source_file_url ?? item.source_file_url ?? null,
  presentation_video_url: overrides.presentation_video_url ?? item.presentation_video_url ?? null,
  grade_id: Number(overrides.grade_id ?? item.grade_id),
  month_id: toNullableNumber(overrides.month_id ?? item.month_id),
  group_id: toNullableNumber(overrides.group_id ?? item.group_id),
  unit_number: overrides.unit_number ?? item.unit_number ?? null,
  unit_title: overrides.unit_title ?? item.unit_title ?? null,
  situation_context: overrides.situation_context ?? item.situation_context ?? null,
  learning_challenge: overrides.learning_challenge ?? item.learning_challenge ?? null,
  structured_content: overrides.structured_content ?? (Array.isArray(item.structured_content) ? item.structured_content : []),
});

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

const PlannerGridCard = ({ item, gradeName, monthName, onOpen, canManage }) => {
  const planningMeta = getPlanningTypeMeta(item.planning_type);
  const totalSessions = getTotalSessions(item);

  return (
    <Card
      sx={{
        height: '100%',
        borderRadius: '24px',
        border: '1px solid #eee4d8',
        boxShadow: '0 18px 42px rgba(78,52,46,0.10)',
        overflow: 'hidden',
        background: 'linear-gradient(180deg, #fffdf8 0%, #ffffff 100%)',
      }}
    >
      <CardActionArea
        onClick={() => onOpen(item)}
        sx={{
          height: '100%',
          p: 2.5,
          display: 'flex',
          alignItems: 'stretch',
        }}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%', minHeight: 260 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1.5, mb: 1.75 }}>
            <Chip
              icon={<TableChart />}
              label={planningMeta.label}
              sx={{ bgcolor: planningMeta.bg, color: planningMeta.color, fontWeight: 800 }}
            />
            {item.unit_number && <Chip label={item.unit_number} size="small" sx={{ fontWeight: 700 }} />}
          </Box>

          <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap', mb: 1.5 }}>
            {gradeName && <Chip label={gradeName} size="small" />}
            {item.group_name && <Chip label={`Seccion ${item.group_name}`} size="small" />}
            {monthName && <Chip label={monthName} size="small" />}
          </Box>

          <Typography
            variant="h6"
            fontWeight={900}
            sx={{
              color: '#3e2723',
              mb: 1.1,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {item.unit_title || item.title}
          </Typography>

          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              mb: 2,
              lineHeight: 1.7,
              display: '-webkit-box',
              WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {item.description || item.situation_context || 'Sin descripcion registrada.'}
          </Typography>

          <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap', mb: 2 }}>
            <Chip label={`${item.structured_content?.length || 0} semana(s)`} size="small" sx={{ fontWeight: 700 }} />
            <Chip label={`${totalSessions} sesiones`} size="small" sx={{ fontWeight: 700 }} />
            {item.source_file_url && <Chip label="PDF fuente" size="small" sx={{ fontWeight: 700 }} />}
            {item.presentation_video_url && (
              <Chip label="Video" size="small" sx={{ fontWeight: 700, bgcolor: '#e3f2fd', color: '#1565c0' }} />
            )}
          </Box>

          <Box sx={{ mt: 'auto', pt: 1.5, borderTop: '1px solid #f2ede6' }}>
            <Typography variant="caption" sx={{ color: '#8d6e63', fontWeight: 700, letterSpacing: 0.3 }}>
              {canManage ? 'Toca para abrir acciones: editar, eliminar o renombrar.' : 'Toca para ver el detalle completo.'}
            </Typography>
          </Box>
        </Box>
      </CardActionArea>
    </Card>
  );
};

const PlannerUnitCard = ({ item, gradeName, monthName }) => {
  const planningMeta = getPlanningTypeMeta(item.planning_type);
  const totalSessions = getTotalSessions(item);

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
            {item.group_name && <Chip label={`Seccion ${item.group_name}`} size="small" />}
            {monthName && <Chip label={monthName} size="small" />}
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
  const canManage = isDocente || isAdmin;

  const [items, setItems] = useState([]);
  const [totalItems, setTotalItems] = useState(0);
  const [grades, setGrades] = useState([]);
  const [months, setMonths] = useState([]);
  const [groups, setGroups] = useState([]);
  const [metaLoading, setMetaLoading] = useState(true);
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGrade, setSelectedGrade] = useState(user?.grade_id ? String(user.grade_id) : '');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [activePlanner, setActivePlanner] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [renameOpen, setRenameOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [renameValue, setRenameValue] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const requestCounter = useRef(0);

  useEffect(() => {
    if (isEstudiante && user?.grade_id) {
      setSelectedGrade(String(user.grade_id));
    }
  }, [isEstudiante, user?.grade_id]);

  useEffect(() => {
    const loadMetaData = async () => {
      setMetaLoading(true);
      const [gradesRes, monthsRes, groupsRes] = await Promise.allSettled([
        axiosInstance.get('/grades/'),
        axiosInstance.get('/months/'),
        axiosInstance.get('/groups/'),
      ]);

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

      if (groupsRes.status === 'fulfilled') {
        setGroups(groupsRes.value.data?.results || groupsRes.value.data || []);
      } else {
        setGroups([]);
        console.error(groupsRes.reason);
      }

      if ([gradesRes, monthsRes, groupsRes].some((result) => result.status !== 'fulfilled')) {
        setError('Se cargaron los planificadores, pero faltan algunos filtros auxiliares.');
      }

      setMetaLoading(false);
    };

    loadMetaData();
  }, []);

  const fetchPlannings = useCallback(async (pageNumber = currentPage) => {
    const requestId = ++requestCounter.current;
    setPageLoading(true);
    try {
      const params = {
        planning_type: 'planificador',
        skip: (pageNumber - 1) * PAGE_SIZE,
        limit: PAGE_SIZE,
      };

      if (selectedGrade) {
        params.grade_id = Number(selectedGrade);
      }
      if (selectedMonth) {
        params.month_id = Number(selectedMonth);
      }
      if (selectedGroup) {
        params.group_id = Number(selectedGroup);
      }
      if (searchTerm.trim()) {
        params.search = searchTerm.trim();
      }

      const response = await axiosInstance.get('/planning/', { params });
      if (requestId !== requestCounter.current) return;
      setItems(response.data?.results || response.data || []);
      setTotalItems(Number(response.headers['x-total-count'] || 0));
      setError('');
    } catch (err) {
      if (requestId !== requestCounter.current) return;
      console.error(err);
      setItems([]);
      setTotalItems(0);
      setError('Error al cargar los planificadores.');
    } finally {
      if (requestId !== requestCounter.current) return;
      setPageLoading(false);
    }
  }, [currentPage, searchTerm, selectedGrade, selectedMonth, selectedGroup]);

  useEffect(() => {
    fetchPlannings(currentPage);
  }, [currentPage, fetchPlannings]);

  const gradesById = useMemo(
    () => Object.fromEntries(grades.map((grade) => [grade.id, grade])),
    [grades],
  );

  const monthsById = useMemo(
    () => Object.fromEntries(months.map((month) => [month.id, month])),
    [months],
  );

  const availableGroups = useMemo(
    () => groups.filter((group) => {
      if (group.is_active === false) return false;
      if (selectedGrade && Number(group.grade_id) !== Number(selectedGrade)) return false;
      return true;
    }),
    [groups, selectedGrade],
  );

  useEffect(() => {
    if (selectedGroup && !availableGroups.some((group) => Number(group.id) === Number(selectedGroup))) {
      setSelectedGroup('');
      setCurrentPage(1);
    }
  }, [availableGroups, selectedGroup]);

  const pageCount = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));

  useEffect(() => {
    if (currentPage > pageCount) {
      setCurrentPage(pageCount);
    }
  }, [currentPage, pageCount]);

  const handleOpenPlanner = (item) => {
    setActivePlanner(item);
    setRenameValue(item.unit_title || item.title || '');
    setDetailOpen(true);
  };

  const handleClosePlanner = () => {
    setDetailOpen(false);
    setActivePlanner(null);
  };

  const handleOpenRename = () => {
    if (!activePlanner) return;
    setRenameValue(activePlanner.unit_title || activePlanner.title || '');
    setRenameOpen(true);
  };

  const handleRename = async () => {
    if (!activePlanner) return;
    const nextName = renameValue.trim();
    if (!nextName) {
      setError('El nombre no puede quedar vacio.');
      return;
    }

    setActionLoading(true);
    try {
      const response = await axiosInstance.put(
        `/planning/${activePlanner.id}`,
        buildPlanningPayload(activePlanner, {
          title: nextName,
          unit_title: activePlanner.planning_type === 'planificador' ? nextName : activePlanner.unit_title,
        }),
      );
      const updatedPlanner = response.data;
      setItems((current) => current.map((item) => (item.id === updatedPlanner.id ? updatedPlanner : item)));
      setActivePlanner(updatedPlanner);
      setRenameOpen(false);
      setSuccess('Planificador renombrado.');
      setError('');
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || 'No se pudo renombrar el planificador.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!activePlanner) return;

    setActionLoading(true);
    try {
      await axiosInstance.delete(`/planning/${activePlanner.id}`);
      setDeleteOpen(false);
      handleClosePlanner();
      setSuccess('Planificador eliminado.');
      setError('');

      const nextPage = items.length === 1 && currentPage > 1 ? currentPage - 1 : currentPage;
      if (nextPage !== currentPage) {
        setCurrentPage(nextPage);
      } else {
        fetchPlannings(nextPage);
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || 'No se pudo eliminar el planificador.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedMonth('');
    setSelectedGroup('');
    setSelectedGrade(isEstudiante && user?.grade_id ? String(user.grade_id) : '');
    setCurrentPage(1);
  };

  if ((metaLoading || pageLoading) && items.length === 0 && !error) {
    return <LoadingSpinner message="Cargando planificacion..." />;
  }

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
        <Container maxWidth="xl" sx={{ position: 'relative', zIndex: 1 }}>
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

          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap' }}>
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
                  Tarjetas de planificador por grado, seccion y mes, con filtros y paginacion real.
                </Typography>
              </Box>
            </Box>

            {canManage && (
              <Button
                variant="contained"
                startIcon={<Settings />}
                onClick={() => navigate('/planning/manage')}
                sx={{ background: '#5d4037', '&:hover': { background: '#3e2723' } }}
              >
                Gestionar planificacion
              </Button>
            )}
          </Box>
        </Container>
      </Box>

      <Container maxWidth="xl" sx={{ py: 4 }}>
        {error && (
          <Alert severity="warning" sx={{ mb: 2, borderRadius: '14px' }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}
        {success && (
          <Alert severity="success" sx={{ mb: 2, borderRadius: '14px' }} onClose={() => setSuccess('')}>
            {success}
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
                  Planificadores por unidad
                </Typography>
                <Typography color="text.secondary">
                  Vista en tarjetas con 4 columnas, 5 filas por pagina y acciones directas al abrir cada planificador.
                </Typography>
              </Box>
            </Box>

            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Chip label={`${totalItems} planificador${totalItems === 1 ? '' : 'es'}`} sx={{ fontWeight: 700 }} />
              <Chip label={`Pagina ${currentPage} de ${pageCount}`} sx={{ fontWeight: 700 }} />
              {pageLoading && <Chip label="Actualizando..." sx={{ fontWeight: 700, bgcolor: '#fff3e0', color: '#ef6c00' }} />}
            </Box>
          </Box>

          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label="Buscar planificador"
                value={searchTerm}
                onChange={(event) => {
                  setSearchTerm(event.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Unidad, titulo o descripcion"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search sx={{ color: '#90a4ae' }} />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth>
                <TextField
                  select
                  label="Grado"
                  value={selectedGrade}
                  onChange={(event) => {
                    setSelectedGrade(event.target.value);
                    setCurrentPage(1);
                  }}
                  disabled={isEstudiante && Boolean(user?.grade_id)}
                >
                  {!isEstudiante && <MenuItem value="">Todos los grados</MenuItem>}
                  {grades.map((grade) => (
                    <MenuItem key={grade.id} value={String(grade.id)}>
                      {grade.name}
                    </MenuItem>
                  ))}
                </TextField>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth>
                <TextField
                  select
                  label="Seccion"
                  value={selectedGroup}
                  onChange={(event) => {
                    setSelectedGroup(event.target.value);
                    setCurrentPage(1);
                  }}
                >
                  <MenuItem value="">Todas las secciones</MenuItem>
                  {availableGroups.map((group) => (
                    <MenuItem key={group.id} value={String(group.id)}>
                      {group.name}
                    </MenuItem>
                  ))}
                </TextField>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth>
                <TextField
                  select
                  label="Mes"
                  value={selectedMonth}
                  onChange={(event) => {
                    setSelectedMonth(event.target.value);
                    setCurrentPage(1);
                  }}
                >
                  <MenuItem value="">Todos los meses</MenuItem>
                  {months.map((month) => (
                    <MenuItem key={month.id} value={String(month.id)}>
                      {month.name}
                    </MenuItem>
                  ))}
                </TextField>
              </FormControl>
            </Grid>
          </Grid>

          <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap', mb: 3 }}>
            <Typography variant="body2" color="text.secondary">
              Cada tarjeta abre el planificador completo. Los perfiles con permisos de gestion reciben tambien las acciones de editar, eliminar y renombrar.
            </Typography>
            <Button variant="outlined" onClick={handleResetFilters}>
              Limpiar filtros
            </Button>
          </Box>

          {items.length === 0 ? (
            <Paper variant="outlined" sx={{ p: 5, borderRadius: '20px', textAlign: 'center', background: '#fff' }}>
              <Typography variant="h6" fontWeight={700} sx={{ mb: 1 }}>
                No hay planificadores para este filtro
              </Typography>
              <Typography color="text.secondary">
                Ajusta grado, seccion o mes para encontrar otro planificador publicado.
              </Typography>
            </Paper>
          ) : (
            <Grid container spacing={2.5}>
              {items.map((item) => (
                <Grid item xs={12} sm={6} md={4} lg={3} key={item.id}>
                  <PlannerGridCard
                    item={item}
                    gradeName={gradesById[item.grade_id]?.name}
                    monthName={item.month_id ? monthsById[item.month_id]?.name : null}
                    onOpen={handleOpenPlanner}
                    canManage={canManage}
                  />
                </Grid>
              ))}
            </Grid>
          )}

          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
            <Pagination
              color="primary"
              count={pageCount}
              page={currentPage}
              onChange={(_, page) => setCurrentPage(page)}
              showFirstButton
              showLastButton
              siblingCount={1}
              boundaryCount={2}
              disabled={pageLoading}
            />
          </Box>
        </Paper>
      </Container>

      <Dialog open={detailOpen} onClose={handleClosePlanner} maxWidth="lg" fullWidth PaperProps={{ sx: { borderRadius: '24px' } }}>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2 }}>
          <Box>
            <Typography variant="h6" fontWeight={800}>
              {activePlanner?.unit_title || activePlanner?.title || 'Planificador'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Tarjeta abierta para ver detalle completo y acciones disponibles.
            </Typography>
          </Box>
          <IconButton onClick={handleClosePlanner}>
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ background: '#f8fafc' }}>
          {activePlanner && (
            <PlannerUnitCard
              item={activePlanner}
              gradeName={gradesById[activePlanner.grade_id]?.name}
              monthName={activePlanner.month_id ? monthsById[activePlanner.month_id]?.name : null}
            />
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2.5, gap: 1, flexWrap: 'wrap', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {canManage && activePlanner && (
              <>
                <Button startIcon={<DriveFileRenameOutline />} onClick={handleOpenRename}>
                  Renombrar
                </Button>
                <Button startIcon={<Edit />} onClick={() => navigate(`/planning/manage?edit=${activePlanner.id}`)}>
                  Editar
                </Button>
                <Button color="error" startIcon={<Delete />} onClick={() => setDeleteOpen(true)}>
                  Eliminar
                </Button>
              </>
            )}
          </Box>
          <Button variant="contained" onClick={handleClosePlanner} sx={{ background: '#6d4c41', '&:hover': { background: '#5d4037' } }}>
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={renameOpen} onClose={() => setRenameOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: '20px' } }}>
        <DialogTitle>
          <Typography variant="h6" fontWeight={800}>
            Renombrar planificador
          </Typography>
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            label="Nuevo nombre visible"
            value={renameValue}
            onChange={(event) => setRenameValue(event.target.value)}
            helperText="Actualiza el nombre de la tarjeta y del planificador."
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2.5, gap: 1 }}>
          <Button variant="outlined" onClick={() => setRenameOpen(false)}>
            Cancelar
          </Button>
          <Button variant="contained" onClick={handleRename} disabled={actionLoading}>
            {actionLoading ? 'Guardando...' : 'Guardar nombre'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={deleteOpen} onClose={() => setDeleteOpen(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: '20px' } }}>
        <DialogTitle>
          <Typography variant="h6" fontWeight={800}>
            Eliminar planificador
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Typography>
            Se eliminara <strong>{activePlanner?.unit_title || activePlanner?.title}</strong>. Esta accion no se puede deshacer.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2.5, gap: 1 }}>
          <Button variant="outlined" onClick={() => setDeleteOpen(false)}>
            Cancelar
          </Button>
          <Button color="error" variant="contained" onClick={handleDelete} disabled={actionLoading}>
            {actionLoading ? 'Eliminando...' : 'Eliminar'}
          </Button>
        </DialogActions>
      </Dialog>

      <Footer />
    </Box>
  );
};

export default PlanningPage;
