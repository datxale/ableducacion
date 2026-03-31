import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Breadcrumbs,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  Link,
  MenuItem,
  Paper,
  Select,
  TextField,
  Typography,
} from '@mui/material';
import {
  Add,
  CalendarMonth,
  Close,
  CloudUpload,
  Delete,
  Edit,
  Home,
  Launch,
  MenuBook,
  Save,
  TableChart,
  VideoCall,
} from '@mui/icons-material';
import { useLocation, useNavigate } from 'react-router-dom';

import axiosInstance from '../../api/axios';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Footer from '../../components/Layout/Footer';
import { useAuth } from '../../context/AuthContext';
import {
  createEmptyPlanningForm,
  createEmptyPlanningSession,
  createEmptyPlanningWeek,
  detectPlanningMediaKind,
  getPlanningTypeMeta,
  getYoutubeEmbedUrl,
  normalizePlanningWeeks,
} from '../../utils/planning';
import { uploadFile } from '../../utils/uploads';

const GOOGLE_CALENDAR_URL = 'https://calendar.google.com/calendar/u/0/r/week';

const PlanningVideoPreview = ({ url }) => {
  if (!url) return null;

  const mediaKind = detectPlanningMediaKind(url);
  const youtubeUrl = mediaKind === 'youtube' ? getYoutubeEmbedUrl(url) : null;

  return (
    <Paper variant="outlined" sx={{ borderRadius: '18px', overflow: 'hidden', background: '#fff' }}>
      {mediaKind === 'youtube' && youtubeUrl && (
        <Box sx={{ position: 'relative', pt: '56.25%' }}>
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
        <Box component="video" controls sx={{ width: '100%', maxHeight: 360, display: 'block', background: '#000' }}>
          <source src={url} />
        </Box>
      )}

      {mediaKind === 'link' && (
        <Box sx={{ p: 2 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            El enlace no es un video MP4/WebM directo ni un enlace de YouTube embebible. Se abrira como enlace externo.
          </Typography>
          <Button variant="outlined" startIcon={<Launch />} href={url} target="_blank" rel="noreferrer">
            Abrir enlace
          </Button>
        </Box>
      )}
    </Paper>
  );
};

const ManagePlanning = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAdmin, isDocente } = useAuth();

  const [items, setItems] = useState([]);
  const [grades, setGrades] = useState([]);
  const [months, setMonths] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [saving, setSaving] = useState(false);
  const [uploadingTarget, setUploadingTarget] = useState('');
  const [form, setForm] = useState(createEmptyPlanningForm());

  const sectionPath = location.pathname.startsWith('/admin') && isAdmin ? '/admin' : '/dashboard';
  const sectionLabel = location.pathname.startsWith('/admin') && isAdmin ? 'Admin' : 'Docencia';
  const classesManagementPath = isAdmin ? '/admin/classes' : '/teaching/classes';

  const fetchData = async () => {
    setLoading(true);
    try {
      const [planningRes, gradesRes, monthsRes, groupsRes] = await Promise.all([
        axiosInstance.get('/planning/'),
        axiosInstance.get('/grades/'),
        axiosInstance.get('/months/'),
        axiosInstance.get('/groups/'),
      ]);
      setItems(planningRes.data?.results || planningRes.data || []);
      setGrades(gradesRes.data?.results || gradesRes.data || []);
      setMonths(monthsRes.data?.results || monthsRes.data || []);
      setGroups(groupsRes.data?.results || groupsRes.data || []);
    } catch (err) {
      setError('Error al cargar la planificacion.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const gradesById = useMemo(
    () => Object.fromEntries(grades.map((grade) => [grade.id, grade])),
    [grades],
  );
  const monthsById = useMemo(
    () => Object.fromEntries(months.map((month) => [month.id, month])),
    [months],
  );
  const groupsById = useMemo(
    () => Object.fromEntries(groups.map((group) => [group.id, group])),
    [groups],
  );
  const availableGroups = useMemo(
    () =>
      groups.filter((group) => {
        if (group.is_active === false) return false;
        if (form.grade_id && Number(group.grade_id) !== Number(form.grade_id)) return false;
        if (isDocente && !isAdmin && user?.id && group.teacher_id !== user.id) return false;
        return true;
      }),
    [form.grade_id, groups, isAdmin, isDocente, user?.id],
  );

  const planners = useMemo(
    () => items.filter((item) => item.planning_type === 'planificador'),
    [items],
  );
  const resources = useMemo(
    () => items.filter((item) => item.planning_type !== 'planificador'),
    [items],
  );

  const resetForm = () => setForm(createEmptyPlanningForm());

  const openCreateDialog = () => {
    setSelectedItem(null);
    resetForm();
    setDialogOpen(true);
  };

  const openEditDialog = (item) => {
    setSelectedItem(item);
    setForm({
      planning_type: item.planning_type || 'planificador',
      title: item.title || '',
      description: item.description || '',
      file_url: item.file_url || '',
      source_file_url: item.source_file_url || '',
      presentation_video_url: item.presentation_video_url || '',
      grade_id: item.grade_id || '',
      month_id: item.month_id || '',
      group_id: item.group_id || '',
      unit_number: item.unit_number || '',
      unit_title: item.unit_title || '',
      situation_context: item.situation_context || '',
      learning_challenge: item.learning_challenge || '',
      structured_content: normalizePlanningWeeks(item.structured_content),
    });
    setDialogOpen(true);
  };

  useEffect(() => {
    if (loading) return;

    const searchParams = new URLSearchParams(location.search);
    const editId = Number(searchParams.get('edit'));
    if (!editId) return;

    const targetItem = items.find((item) => item.id === editId);
    if (targetItem) {
      openEditDialog(targetItem);
    } else {
      setError('El planificador solicitado ya no esta disponible.');
    }

    navigate(location.pathname, { replace: true });
  }, [items, loading, location.pathname, location.search, navigate]);

  const handleBasicChange = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  useEffect(() => {
    if (!form.group_id) return;
    const selectedGroup = groupsById[Number(form.group_id)];
    if (!selectedGroup) {
      setForm((current) => ({ ...current, group_id: '' }));
      return;
    }
    if (form.grade_id && Number(selectedGroup.grade_id) !== Number(form.grade_id)) {
      setForm((current) => ({ ...current, group_id: '' }));
      return;
    }
    if (isDocente && !isAdmin && user?.id && selectedGroup.teacher_id !== user.id) {
      setForm((current) => ({ ...current, group_id: '' }));
    }
  }, [form.grade_id, form.group_id, groupsById, isAdmin, isDocente, user?.id]);

  const handleWeekChange = (weekIndex, field, value) => {
    setForm((current) => ({
      ...current,
      structured_content: current.structured_content.map((week, index) =>
        index === weekIndex ? { ...week, [field]: value } : week,
      ),
    }));
  };

  const handleDayChange = (weekIndex, dayIndex, field, value) => {
    setForm((current) => ({
      ...current,
      structured_content: current.structured_content.map((week, currentWeekIndex) => {
        if (currentWeekIndex !== weekIndex) return week;
        return {
          ...week,
          days: week.days.map((day, currentDayIndex) =>
            currentDayIndex === dayIndex ? { ...day, [field]: value } : day,
          ),
        };
      }),
    }));
  };

  const handleSessionChange = (weekIndex, dayIndex, sessionIndex, field, value) => {
    setForm((current) => ({
      ...current,
      structured_content: current.structured_content.map((week, currentWeekIndex) => {
        if (currentWeekIndex !== weekIndex) return week;
        return {
          ...week,
          days: week.days.map((day, currentDayIndex) => {
            if (currentDayIndex !== dayIndex) return day;
            return {
              ...day,
              sessions: day.sessions.map((session, currentSessionIndex) =>
                currentSessionIndex === sessionIndex ? { ...session, [field]: value } : session,
              ),
            };
          }),
        };
      }),
    }));
  };

  const addWeek = () => {
    setForm((current) => ({
      ...current,
      structured_content: [
        ...current.structured_content,
        createEmptyPlanningWeek(current.structured_content.length + 1),
      ],
    }));
  };

  const removeWeek = (weekIndex) => {
    setForm((current) => {
      const remainingWeeks = current.structured_content.filter((_, index) => index !== weekIndex);
      return {
        ...current,
        structured_content: remainingWeeks.map((week, index) => ({
          ...week,
          week_number: index + 1,
          title: week.title || `Semana ${index + 1}`,
        })),
      };
    });
  };

  const addSession = (weekIndex, dayIndex) => {
    setForm((current) => ({
      ...current,
      structured_content: current.structured_content.map((week, currentWeekIndex) => {
        if (currentWeekIndex !== weekIndex) return week;
        return {
          ...week,
          days: week.days.map((day, currentDayIndex) =>
            currentDayIndex === dayIndex
              ? { ...day, sessions: [...day.sessions, createEmptyPlanningSession()] }
              : day,
          ),
        };
      }),
    }));
  };

  const removeSession = (weekIndex, dayIndex, sessionIndex) => {
    setForm((current) => ({
      ...current,
      structured_content: current.structured_content.map((week, currentWeekIndex) => {
        if (currentWeekIndex !== weekIndex) return week;
        return {
          ...week,
          days: week.days.map((day, currentDayIndex) => {
            if (currentDayIndex !== dayIndex) return day;
            const remainingSessions = day.sessions.filter((_, index) => index !== sessionIndex);
            return {
              ...day,
              sessions: remainingSessions.length > 0 ? remainingSessions : [createEmptyPlanningSession()],
            };
          }),
        };
      }),
    }));
  };

  const normalizeStructuredPayload = () => (
    form.structured_content.map((week, weekIndex) => ({
      week_number: Number(week.week_number) || weekIndex + 1,
      title: (week.title || `Semana ${weekIndex + 1}`).trim(),
      days: week.days.map((day) => ({
        day_key: day.day_key,
        day_label: day.day_label,
        date_label: (day.date_label || '').trim() || null,
        sessions: day.sessions
          .map((session) => ({
            subject: (session.subject || '').trim(),
            title: (session.title || '').trim(),
          }))
          .filter((session) => session.subject && session.title),
      })),
    }))
  );

  const validatePlannerForm = () => {
    if (!form.unit_number.trim() || !form.unit_title.trim()) {
      setError('Unidad y titulo de la unidad son obligatorios.');
      return false;
    }
    if (!form.situation_context.trim() || !form.learning_challenge.trim()) {
      setError('La situacion significativa y el reto son obligatorios.');
      return false;
    }
    const structuredPayload = normalizeStructuredPayload();
    const sessionCount = structuredPayload.reduce(
      (total, week) => total + week.days.reduce((dayTotal, day) => dayTotal + day.sessions.length, 0),
      0,
    );
    if (sessionCount === 0) {
      setError('Agrega al menos una sesion dentro del planificador.');
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!form.title.trim() || !form.grade_id) {
      setError('Titulo y grado son obligatorios.');
      return;
    }
    if (form.planning_type === 'planificador' && !validatePlannerForm()) {
      return;
    }

    setSaving(true);
    setError('');

    const payload = {
      planning_type: form.planning_type,
      title: form.title.trim(),
      description: form.description.trim() || null,
      file_url: form.file_url.trim() || null,
      source_file_url: form.source_file_url.trim() || null,
      presentation_video_url: form.presentation_video_url.trim() || null,
      grade_id: Number(form.grade_id),
      month_id: form.month_id ? Number(form.month_id) : null,
      group_id: form.group_id ? Number(form.group_id) : null,
      unit_number: form.planning_type === 'planificador' ? form.unit_number.trim() || null : null,
      unit_title: form.planning_type === 'planificador' ? form.unit_title.trim() || null : null,
      situation_context: form.planning_type === 'planificador' ? form.situation_context.trim() || null : null,
      learning_challenge: form.planning_type === 'planificador' ? form.learning_challenge.trim() || null : null,
      structured_content: form.planning_type === 'planificador' ? normalizeStructuredPayload() : [],
    };

    try {
      if (selectedItem) {
        await axiosInstance.put(`/planning/${selectedItem.id}`, payload);
        setSuccess('Recurso actualizado.');
      } else {
        await axiosInstance.post('/planning/', payload);
        setSuccess(form.planning_type === 'planificador' ? 'Planificador creado.' : 'Recurso creado.');
      }
      setDialogOpen(false);
      resetForm();
      fetchData();
    } catch (err) {
      const detail = err.response?.data?.detail;
      setError(Array.isArray(detail) ? detail[0]?.msg || 'Error al guardar.' : detail || 'Error al guardar.');
    } finally {
      setSaving(false);
    }
  };

  const handleFileUpload = async (event, targetField) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploadingTarget(targetField);
    setError('');
    try {
      const uploaded = await uploadFile(file, 'planning');
      setForm((current) => ({ ...current, [targetField]: uploaded.url }));
    } catch (err) {
      setError(err.response?.data?.detail || 'No se pudo subir el archivo.');
    } finally {
      setUploadingTarget('');
      event.target.value = '';
    }
  };

  const handleDelete = async () => {
    if (!selectedItem) return;
    setSaving(true);
    try {
      await axiosInstance.delete(`/planning/${selectedItem.id}`);
      setSuccess('Recurso eliminado.');
      setDeleteDialogOpen(false);
      fetchData();
    } catch (err) {
      setError('Error al eliminar el recurso.');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingSpinner message="Cargando planificacion..." />;

  return (
    <Box sx={{ background: '#f5f7fa', minHeight: '100vh' }}>
      <Box sx={{ background: 'linear-gradient(135deg, #ff9800 0%, #ffb74d 100%)', py: 5 }}>
        <Container maxWidth="lg">
          <Breadcrumbs sx={{ mb: 2 }} separator=">">
            <Link component="button" onClick={() => navigate('/dashboard')} sx={{ color: 'rgba(255,255,255,0.8)', textDecoration: 'none', fontSize: '0.9rem', '&:hover': { color: '#fff' } }}>
              <Home sx={{ fontSize: '1rem', mr: 0.3, verticalAlign: 'middle' }} /> Dashboard
            </Link>
            <Link component="button" onClick={() => navigate(sectionPath)} sx={{ color: 'rgba(255,255,255,0.8)', textDecoration: 'none', fontSize: '0.9rem', '&:hover': { color: '#fff' } }}>
              {sectionLabel}
            </Link>
            <Typography sx={{ color: '#fff', fontWeight: 600, fontSize: '0.9rem' }}>
              Planificacion
            </Typography>
          </Breadcrumbs>

          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{ background: 'rgba(255,255,255,0.25)', borderRadius: '16px', p: 1.5, display: 'flex' }}>
                <TableChart sx={{ color: '#fff', fontSize: '2.5rem' }} />
              </Box>
              <Box>
                <Typography variant="h4" fontWeight={800} sx={{ color: '#fff' }}>
                  Gestion de planificacion
                </Typography>
                <Typography sx={{ color: 'rgba(255,255,255,0.9)' }}>
                  {planners.length} planificador{planners.length !== 1 ? 'es' : ''} y {resources.length} recurso{resources.length !== 1 ? 's' : ''} complementario{resources.length !== 1 ? 's' : ''}
                </Typography>
              </Box>
            </Box>
            <Button variant="contained" startIcon={<Add />} onClick={openCreateDialog} sx={{ background: '#6d4c41', '&:hover': { background: '#4e342e' } }}>
              Nuevo contenido
            </Button>
          </Box>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        {error && <Alert severity="error" sx={{ mb: 2, borderRadius: '12px' }} onClose={() => setError('')}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2, borderRadius: '12px' }} onClose={() => setSuccess('')}>{success}</Alert>}

        <Paper
          sx={{
            p: 2.5,
            mb: 3,
            borderRadius: '20px',
            background: 'linear-gradient(135deg, #f3e5f5, #ffffff)',
            border: '1px solid #e1bee7',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 2,
            flexWrap: 'wrap',
          }}
        >
          <Box>
            <Typography variant="h6" fontWeight={700} sx={{ mb: 0.5 }}>
              Planificador pedagogico + Google Calendar
            </Typography>
            <Typography color="text.secondary">
              La planificacion curricular se crea aqui por unidad, semanas y sesiones. Google Calendar sigue reservado para clases en vivo y Meet.
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Button
              variant="contained"
              startIcon={<VideoCall />}
              onClick={() => navigate(classesManagementPath)}
              sx={{ background: '#6a1b9a', '&:hover': { background: '#4a148c' } }}
            >
              Gestionar clases
            </Button>
            <Button
              variant="outlined"
              startIcon={<Launch />}
              href={GOOGLE_CALENDAR_URL}
              target="_blank"
              rel="noreferrer"
              sx={{ borderColor: '#6a1b9a', color: '#6a1b9a' }}
            >
              Abrir Google Calendar
            </Button>
          </Box>
        </Paper>

        <Typography variant="h5" fontWeight={800} sx={{ mb: 2 }}>
          Planificadores por unidad
        </Typography>

        <Grid container spacing={2.5} sx={{ mb: 4 }}>
          {planners.length === 0 ? (
            <Grid item xs={12}>
              <Paper sx={{ p: 5, textAlign: 'center', borderRadius: '20px' }}>
                <Typography variant="h6" fontWeight={700} sx={{ mb: 1 }}>
                  Aun no hay planificadores publicados
                </Typography>
                <Typography color="text.secondary">
                  Crea un planificador por unidad con semanas, dias y sesiones para que la vista de Planificacion cumpla el formato curricular.
                </Typography>
              </Paper>
            </Grid>
          ) : (
            planners.map((item) => {
              const typeMeta = getPlanningTypeMeta(item.planning_type);
              const totalSessions = (item.structured_content || []).reduce(
                (total, week) => total + (week.days || []).reduce((dayTotal, day) => dayTotal + (day.sessions || []).length, 0),
                0,
              );

              return (
                <Grid item xs={12} md={6} key={item.id}>
                  <Card sx={{ height: '100%', borderRadius: '22px', boxShadow: '0 8px 24px rgba(0,0,0,0.06)' }}>
                    <CardContent sx={{ p: 2.5 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1.5, mb: 2 }}>
                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                          <Chip label={typeMeta.label} sx={{ bgcolor: typeMeta.bg, color: typeMeta.color, fontWeight: 800 }} />
                          <Chip label={gradesById[item.grade_id]?.name || `Grado ${item.grade_id}`} size="small" />
                          {item.month_id && <Chip label={monthsById[item.month_id]?.name || `Mes ${item.month_id}`} size="small" />}
                          {item.group_name && <Chip label={`Seccion ${item.group_name}`} size="small" />}
                        </Box>
                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                          <IconButton size="small" onClick={() => openEditDialog(item)} sx={{ color: '#1565c0', bgcolor: '#e3f2fd' }}>
                            <Edit fontSize="small" />
                          </IconButton>
                          <IconButton size="small" onClick={() => { setSelectedItem(item); setDeleteDialogOpen(true); }} sx={{ color: '#d32f2f', bgcolor: '#ffebee' }}>
                            <Delete fontSize="small" />
                          </IconButton>
                        </Box>
                      </Box>

                      <Typography variant="subtitle2" sx={{ color: '#795548', fontWeight: 800, mb: 0.5 }}>
                        {item.unit_number || 'Unidad'}
                      </Typography>
                      <Typography variant="h6" fontWeight={800} sx={{ mb: 1 }}>
                        {item.unit_title || item.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                        {item.description || 'Planificador curricular estructurado para la plataforma.'}
                      </Typography>

                      <Paper variant="outlined" sx={{ p: 1.5, borderRadius: '16px', mb: 1.5, background: '#faf7f5' }}>
                        <Typography variant="caption" sx={{ display: 'block', color: '#8d6e63', fontWeight: 800, mb: 0.5 }}>
                          Situacion significativa
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#5d4037', lineHeight: 1.6 }}>
                          {item.situation_context || 'Sin detalle registrado'}
                        </Typography>
                      </Paper>

                      <Paper variant="outlined" sx={{ p: 1.5, borderRadius: '16px', mb: 1.5, background: '#f8fafc' }}>
                        <Typography variant="caption" sx={{ display: 'block', color: '#1565c0', fontWeight: 800, mb: 0.5 }}>
                          Reto
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#334155', lineHeight: 1.6 }}>
                          {item.learning_challenge || 'Sin reto registrado'}
                        </Typography>
                      </Paper>

                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                        <Chip label={`${item.structured_content?.length || 0} semana(s)`} size="small" sx={{ fontWeight: 700 }} />
                        <Chip label={`${totalSessions} sesiones`} size="small" sx={{ fontWeight: 700 }} />
                        {item.presentation_video_url && <Chip label="Video de presentacion" size="small" sx={{ fontWeight: 700, bgcolor: '#e3f2fd', color: '#1565c0' }} />}
                      </Box>

                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        {item.source_file_url && (
                          <Button variant="outlined" startIcon={<Launch />} href={item.source_file_url} target="_blank" rel="noreferrer" sx={{ boxShadow: 'none', '&:hover': { boxShadow: 'none', transform: 'none' } }}>
                            Ver PDF fuente
                          </Button>
                        )}
                        {item.file_url && (
                          <Button variant="outlined" startIcon={<MenuBook />} href={item.file_url} target="_blank" rel="noreferrer" sx={{ boxShadow: 'none', '&:hover': { boxShadow: 'none', transform: 'none' } }}>
                            Recurso extra
                          </Button>
                        )}
                        {item.presentation_video_url && (
                          <Button variant="outlined" startIcon={<VideoCall />} href={item.presentation_video_url} target="_blank" rel="noreferrer" sx={{ boxShadow: 'none', '&:hover': { boxShadow: 'none', transform: 'none' } }}>
                            Ver video
                          </Button>
                        )}
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              );
            })
          )}
        </Grid>

        <Typography variant="h5" fontWeight={800} sx={{ mb: 2 }}>
          Recursos complementarios
        </Typography>

        <Grid container spacing={2.5}>
          {resources.length === 0 ? (
            <Grid item xs={12}>
              <Paper sx={{ p: 5, textAlign: 'center', borderRadius: '20px' }}>
                <Typography variant="h6" fontWeight={700} sx={{ mb: 1 }}>
                  No hay horarios ni guias publicadas
                </Typography>
                <Typography color="text.secondary">
                  Puedes seguir publicando horarios y guias como apoyo adicional al planificador de unidad.
                </Typography>
              </Paper>
            </Grid>
          ) : (
            resources.map((item) => {
              const typeMeta = getPlanningTypeMeta(item.planning_type);
              return (
                <Grid item xs={12} md={6} lg={4} key={item.id}>
                  <Card sx={{ height: '100%', borderRadius: '20px' }}>
                    <CardContent sx={{ p: 2.5 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1, mb: 2 }}>
                        <Chip
                          icon={item.planning_type === 'horario' ? <CalendarMonth /> : <MenuBook />}
                          label={typeMeta.label}
                          sx={{ bgcolor: typeMeta.bg, color: typeMeta.color, fontWeight: 700 }}
                        />
                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                          <IconButton size="small" onClick={() => openEditDialog(item)} sx={{ color: '#1565c0', bgcolor: '#e3f2fd' }}>
                            <Edit fontSize="small" />
                          </IconButton>
                          <IconButton size="small" onClick={() => { setSelectedItem(item); setDeleteDialogOpen(true); }} sx={{ color: '#d32f2f', bgcolor: '#ffebee' }}>
                            <Delete fontSize="small" />
                          </IconButton>
                        </Box>
                      </Box>

                      <Typography variant="h6" fontWeight={700} sx={{ mb: 1 }}>
                        {item.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2, minHeight: 40 }}>
                        {item.description || 'Sin descripcion'}
                      </Typography>

                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                        <Chip label={gradesById[item.grade_id]?.name || `Grado ${item.grade_id}`} size="small" />
                        {item.month_id && <Chip label={monthsById[item.month_id]?.name || `Mes ${item.month_id}`} size="small" />}
                        {item.group_name && <Chip label={`Seccion ${item.group_name}`} size="small" />}
                      </Box>

                      <Button fullWidth variant={item.file_url ? 'contained' : 'outlined'} href={item.file_url || undefined} target={item.file_url ? '_blank' : undefined} disabled={!item.file_url}>
                        {item.file_url ? 'Abrir recurso' : 'Sin archivo'}
                      </Button>
                    </CardContent>
                  </Card>
                </Grid>
              );
            })
          )}
        </Grid>
      </Container>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="lg" fullWidth PaperProps={{ sx: { borderRadius: '20px' } }}>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" fontWeight={700}>
            {selectedItem ? 'Editar contenido de planificacion' : 'Nuevo contenido de planificacion'}
          </Typography>
          <IconButton onClick={() => setDialogOpen(false)} size="small"><Close /></IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Tipo</InputLabel>
                <Select value={form.planning_type} label="Tipo" onChange={(event) => handleBasicChange('planning_type', event.target.value)}>
                  <MenuItem value="planificador">Planificador curricular</MenuItem>
                  <MenuItem value="horario">Horario</MenuItem>
                  <MenuItem value="guia">Guia</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Grado</InputLabel>
                <Select value={form.grade_id} label="Grado" onChange={(event) => handleBasicChange('grade_id', event.target.value)}>
                  {grades.map((grade) => <MenuItem key={grade.id} value={grade.id}>{grade.name}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Seccion</InputLabel>
                <Select value={form.group_id} label="Seccion" onChange={(event) => handleBasicChange('group_id', event.target.value)} disabled={!form.grade_id}>
                  <MenuItem value="">Todo el grado</MenuItem>
                  {availableGroups.map((group) => <MenuItem key={group.id} value={group.id}>{group.name}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Mes</InputLabel>
                <Select value={form.month_id} label="Mes" onChange={(event) => handleBasicChange('month_id', event.target.value)}>
                  <MenuItem value="">Todos</MenuItem>
                  {months.map((month) => <MenuItem key={month.id} value={month.id}>{month.name}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <TextField fullWidth label="Titulo general" value={form.title} onChange={(event) => handleBasicChange('title', event.target.value)} />
            </Grid>

            <Grid item xs={12}>
              <TextField fullWidth label="Descripcion breve" multiline rows={2} value={form.description} onChange={(event) => handleBasicChange('description', event.target.value)} />
            </Grid>

            {form.planning_type === 'planificador' ? (
              <>
                <Grid item xs={12} md={4}>
                  <TextField fullWidth label="Unidad" placeholder="Unidad 1" value={form.unit_number} onChange={(event) => handleBasicChange('unit_number', event.target.value)} />
                </Grid>
                <Grid item xs={12} md={8}>
                  <TextField fullWidth label="Titulo de la unidad" value={form.unit_title} onChange={(event) => handleBasicChange('unit_title', event.target.value)} />
                </Grid>

                <Grid item xs={12}>
                  <TextField fullWidth label="Situacion significativa" multiline rows={4} value={form.situation_context} onChange={(event) => handleBasicChange('situation_context', event.target.value)} />
                </Grid>

                <Grid item xs={12}>
                  <TextField fullWidth label="Reto o pregunta orientadora" multiline rows={3} value={form.learning_challenge} onChange={(event) => handleBasicChange('learning_challenge', event.target.value)} />
                </Grid>

                <Grid item xs={12} md={8}>
                  <TextField fullWidth label="URL del PDF fuente" placeholder="https://..." value={form.source_file_url} onChange={(event) => handleBasicChange('source_file_url', event.target.value)} />
                </Grid>
                <Grid item xs={12} md={4}>
                  <Button
                    component="label"
                    fullWidth
                    variant="outlined"
                    startIcon={<CloudUpload />}
                    disabled={uploadingTarget === 'source_file_url'}
                    sx={{ height: '56px', boxShadow: 'none', '&:hover': { boxShadow: 'none', transform: 'none' } }}
                  >
                    {uploadingTarget === 'source_file_url' ? 'Subiendo PDF...' : 'Subir PDF fuente'}
                    <input type="file" hidden onChange={(event) => handleFileUpload(event, 'source_file_url')} />
                  </Button>
                </Grid>

                <Grid item xs={12}>
                  <TextField fullWidth label="URL de recurso adicional" placeholder="https://..." value={form.file_url} onChange={(event) => handleBasicChange('file_url', event.target.value)} />
                </Grid>

                <Grid item xs={12} md={8}>
                  <TextField fullWidth label="URL del video de presentacion" placeholder="https://... o /api/uploads/..." value={form.presentation_video_url} onChange={(event) => handleBasicChange('presentation_video_url', event.target.value)} />
                </Grid>
                <Grid item xs={12} md={4}>
                  <Button
                    component="label"
                    fullWidth
                    variant="outlined"
                    startIcon={<CloudUpload />}
                    disabled={uploadingTarget === 'presentation_video_url'}
                    sx={{ height: '56px', boxShadow: 'none', '&:hover': { boxShadow: 'none', transform: 'none' } }}
                  >
                    {uploadingTarget === 'presentation_video_url' ? 'Subiendo video...' : 'Subir video'}
                    <input type="file" accept=".mp4,.webm,.mov,.m4v,.ogg,video/*" hidden onChange={(event) => handleFileUpload(event, 'presentation_video_url')} />
                  </Button>
                </Grid>

                {form.presentation_video_url && (
                  <Grid item xs={12}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, alignItems: 'center', mb: 1 }}>
                      <Typography variant="subtitle2" fontWeight={800}>
                        Vista previa del video de presentacion
                      </Typography>
                      <Button color="error" size="small" onClick={() => handleBasicChange('presentation_video_url', '')} sx={{ boxShadow: 'none', '&:hover': { boxShadow: 'none', transform: 'none' } }}>
                        Quitar video
                      </Button>
                    </Box>
                    <PlanningVideoPreview url={form.presentation_video_url} />
                  </Grid>
                )}

                <Grid item xs={12}>
                  <Paper sx={{ p: 2, borderRadius: '18px', background: '#faf7f5', border: '1px solid #efebe9' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2, mb: 2, flexWrap: 'wrap' }}>
                      <Box>
                        <Typography variant="subtitle1" fontWeight={800}>
                          Matriz semanal del planificador
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Completa cada semana con sus dias y sesiones tal como se vera en la vista publica.
                        </Typography>
                      </Box>
                      <Button variant="contained" startIcon={<Add />} onClick={addWeek} sx={{ background: '#6d4c41', '&:hover': { background: '#5d4037' } }}>
                        Agregar semana
                      </Button>
                    </Box>

                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      {form.structured_content.map((week, weekIndex) => (
                        <Paper key={`${week.week_number}-${weekIndex}`} variant="outlined" sx={{ p: 2, borderRadius: '18px', background: '#fff' }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2, mb: 2, flexWrap: 'wrap' }}>
                            <TextField label="Titulo de semana" value={week.title} onChange={(event) => handleWeekChange(weekIndex, 'title', event.target.value)} sx={{ minWidth: { xs: '100%', md: 280 } }} />
                            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                              <Chip label={`Semana ${weekIndex + 1}`} sx={{ fontWeight: 800 }} />
                              {form.structured_content.length > 1 && (
                                <Button color="error" onClick={() => removeWeek(weekIndex)} sx={{ boxShadow: 'none', '&:hover': { boxShadow: 'none', transform: 'none' } }}>
                                  Quitar semana
                                </Button>
                              )}
                            </Box>
                          </Box>

                          <Grid container spacing={2}>
                            {week.days.map((day, dayIndex) => (
                              <Grid item xs={12} md={6} xl={4} key={`${day.day_key}-${dayIndex}`}>
                                <Paper variant="outlined" sx={{ p: 1.5, borderRadius: '16px', height: '100%' }}>
                                  <Typography variant="subtitle2" fontWeight={800} sx={{ mb: 1 }}>
                                    {day.day_label}
                                  </Typography>

                                  <TextField fullWidth label="Fecha o rango" value={day.date_label || ''} onChange={(event) => handleDayChange(weekIndex, dayIndex, 'date_label', event.target.value)} sx={{ mb: 1.5 }} />

                                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
                                    {day.sessions.map((session, sessionIndex) => (
                                      <Paper key={`${day.day_key}-session-${sessionIndex}`} variant="outlined" sx={{ p: 1.25, borderRadius: '14px', background: '#fcfcfc' }}>
                                        <TextField fullWidth label="Area o curso" value={session.subject} onChange={(event) => handleSessionChange(weekIndex, dayIndex, sessionIndex, 'subject', event.target.value)} sx={{ mb: 1 }} />
                                        <TextField fullWidth label="Sesion o actividad" multiline rows={2} value={session.title} onChange={(event) => handleSessionChange(weekIndex, dayIndex, sessionIndex, 'title', event.target.value)} />
                                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
                                          <Button color="error" size="small" onClick={() => removeSession(weekIndex, dayIndex, sessionIndex)} sx={{ boxShadow: 'none', '&:hover': { boxShadow: 'none', transform: 'none' } }}>
                                            Quitar sesion
                                          </Button>
                                        </Box>
                                      </Paper>
                                    ))}
                                  </Box>

                                  <Button variant="text" size="small" startIcon={<Add />} onClick={() => addSession(weekIndex, dayIndex)} sx={{ mt: 1, color: '#6d4c41' }}>
                                    Agregar sesion
                                  </Button>
                                </Paper>
                              </Grid>
                            ))}
                          </Grid>
                        </Paper>
                      ))}
                    </Box>
                  </Paper>
                </Grid>
              </>
            ) : (
              <>
                <Grid item xs={12}>
                  <TextField fullWidth label="URL del archivo" placeholder="https://..." value={form.file_url} onChange={(event) => handleBasicChange('file_url', event.target.value)} />
                </Grid>
                <Grid item xs={12}>
                  <Button
                    component="label"
                    variant="outlined"
                    startIcon={<CloudUpload />}
                    disabled={uploadingTarget === 'file_url'}
                    sx={{ boxShadow: 'none', '&:hover': { boxShadow: 'none', transform: 'none' } }}
                  >
                    {uploadingTarget === 'file_url' ? 'Subiendo archivo...' : 'Subir archivo'}
                    <input type="file" hidden onChange={(event) => handleFileUpload(event, 'file_url')} />
                  </Button>
                </Grid>
              </>
            )}
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2.5, gap: 1 }}>
          <Button variant="outlined" onClick={() => setDialogOpen(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving} startIcon={<Save />} sx={{ background: '#ff9800', '&:hover': { background: '#ef6c00' } }}>
            {saving ? 'Guardando...' : 'Guardar'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: '20px' } }}>
        <DialogTitle>
          <Typography variant="h6" fontWeight={700}>Confirmar eliminacion</Typography>
        </DialogTitle>
        <DialogContent>
          <Typography>Eliminar el recurso <strong>{selectedItem?.title}</strong>?</Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2.5, gap: 1 }}>
          <Button variant="outlined" onClick={() => setDeleteDialogOpen(false)}>Cancelar</Button>
          <Button variant="contained" color="error" onClick={handleDelete} disabled={saving}>
            {saving ? 'Eliminando...' : 'Eliminar'}
          </Button>
        </DialogActions>
      </Dialog>

      <Footer />
    </Box>
  );
};

export default ManagePlanning;
