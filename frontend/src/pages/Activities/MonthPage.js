import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Breadcrumbs,
  Button,
  Card,
  CardActions,
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
  InputAdornment,
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
  ArrowForward,
  AutoStories,
  CalendarViewWeek,
  Delete,
  Edit,
  Home,
  OndemandVideo,
  Quiz,
  Search,
  Save,
} from '@mui/icons-material';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';

import axiosInstance from '../../api/axios';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Footer from '../../components/Layout/Footer';
import { useAuth } from '../../context/AuthContext';

const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

const WEEK_COLORS = [
  { bg: 'linear-gradient(135deg, #FF6B6B, #FF8E53)', shadow: 'rgba(255,107,107,0.32)' },
  { bg: 'linear-gradient(135deg, #4ECDC4, #44A08D)', shadow: 'rgba(78,205,196,0.32)' },
  { bg: 'linear-gradient(135deg, #A770EF, #CF8BF3)', shadow: 'rgba(167,112,239,0.32)' },
  { bg: 'linear-gradient(135deg, #f7971e, #ffd200)', shadow: 'rgba(247,151,30,0.32)' },
  { bg: 'linear-gradient(135deg, #42a5f5, #478ed1)', shadow: 'rgba(66,165,245,0.32)' },
  { bg: 'linear-gradient(135deg, #66bb6a, #2e7d32)', shadow: 'rgba(102,187,106,0.32)' },
];

const CONTENT_FILTER_OPTIONS = [
  { value: 'all', label: 'Todo el contenido' },
  { value: 'ficha', label: 'Fichas' },
  { value: 'video', label: 'Videos' },
  { value: 'material', label: 'Materiales' },
  { value: 'tarea', label: 'Tareas' },
  { value: 'examen', label: 'Examenes' },
];

const STATUS_FILTER_OPTIONS = [
  { value: 'all', label: 'Todas' },
  { value: 'with-content', label: 'Con contenido' },
  { value: 'without-content', label: 'Sin contenido' },
];

const countWeekContent = (activities = []) => ({
  total: activities.length,
  fichas: activities.filter((item) => item.activity_type === 'ficha').length,
  videos: activities.filter((item) => item.activity_type === 'video').length,
  materiales: activities.filter((item) => item.learning_format === 'material').length,
  tareas: activities.filter((item) => item.learning_format === 'tarea').length,
  examenes: activities.filter((item) => item.learning_format === 'examen').length,
});

const weekMatchesContentFilter = (week, filterValue) => {
  if (filterValue === 'all') return true;
  if (filterValue === 'ficha' || filterValue === 'video') {
    return week.activities.some((item) => item.activity_type === filterValue);
  }
  return week.activities.some((item) => item.learning_format === filterValue);
};

const monthSummaryFromWeeks = (weeks) => {
  const allActivities = weeks.flatMap((week) => week.activities);
  const withContent = weeks.filter((week) => week.activities.length > 0).length;

  return {
    weeks: weeks.length,
    withContent,
    total: allActivities.length,
    fichas: allActivities.filter((item) => item.activity_type === 'ficha').length,
    videos: allActivities.filter((item) => item.activity_type === 'video').length,
    evaluaciones: allActivities.filter((item) => item.learning_format !== 'material').length,
  };
};

const MonthPage = () => {
  const { subjectId, month } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isAdmin, isDocente } = useAuth();

  const canManageWeeks = isAdmin || isDocente;
  const monthNumber = Number(month);
  const activeGroupId = searchParams.get('group_id');
  const activeGroupName = searchParams.get('group_name');
  const activeGroupLabel = activeGroupName || (activeGroupId ? `Seccion ${activeGroupId}` : '');
  const groupQuery = useMemo(() => {
    const params = new URLSearchParams();
    if (activeGroupId) params.set('group_id', activeGroupId);
    if (activeGroupName) params.set('group_name', activeGroupName);
    const value = params.toString();
    return value ? `?${value}` : '';
  }, [activeGroupId, activeGroupName]);

  const [subject, setSubject] = useState(null);
  const [monthRecord, setMonthRecord] = useState(null);
  const [weeks, setWeeks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [contentFilter, setContentFilter] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedWeek, setSelectedWeek] = useState(null);
  const [weekForm, setWeekForm] = useState({ number: '' });

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const [subjectRes, monthsRes] = await Promise.all([
        axiosInstance.get(`/subjects/${subjectId}/`),
        axiosInstance.get('/months/'),
      ]);

      const currentMonthRecord = (monthsRes.data || []).find((item) => item.number === monthNumber);
      if (!currentMonthRecord) {
        throw new Error('Mes no encontrado');
      }

      const weeksRes = await axiosInstance.get('/weeks/', {
        params: { subject_id: subjectId, month_id: currentMonthRecord.id },
      });

      const rawWeeks = (weeksRes.data || []).sort((left, right) => left.number - right.number);
      const activitiesPerWeek = await Promise.all(
        rawWeeks.map((weekItem) =>
          axiosInstance
            .get('/activities/', { params: { week_id: weekItem.id } })
            .then((response) => response.data || [])
        )
      );

      const normalizedWeeks = rawWeeks.map((weekItem, index) => ({
        ...weekItem,
        activities: activitiesPerWeek[index] || [],
        summary: countWeekContent(activitiesPerWeek[index] || []),
      }));

      setSubject(subjectRes.data);
      setMonthRecord(currentMonthRecord);
      setWeeks(normalizedWeeks);
    } catch (err) {
      setError('No se pudieron cargar las semanas de este mes.');
    } finally {
      setLoading(false);
    }
  }, [monthNumber, subjectId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const monthName = MONTHS[monthNumber - 1] || `Mes ${month}`;

  const visibleWeeks = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    return weeks.filter((weekItem) => {
      const weekText = [
        `semana ${weekItem.number}`,
        ...weekItem.activities.map((activity) =>
          [activity.title, activity.description, activity.instructions]
            .filter(Boolean)
            .join(' ')
        ),
      ]
        .join(' ')
        .toLowerCase();

      if (term && !weekText.includes(term)) {
        return false;
      }

      if (statusFilter === 'with-content' && weekItem.activities.length === 0) {
        return false;
      }

      if (statusFilter === 'without-content' && weekItem.activities.length > 0) {
        return false;
      }

      if (!weekMatchesContentFilter(weekItem, contentFilter)) {
        return false;
      }

      return true;
    });
  }, [contentFilter, searchTerm, statusFilter, weeks]);

  const monthSummary = useMemo(() => monthSummaryFromWeeks(weeks), [weeks]);

  const openCreateDialog = () => {
    const nextNumber = weeks.length > 0 ? Math.max(...weeks.map((weekItem) => weekItem.number)) + 1 : 1;
    setSelectedWeek(null);
    setWeekForm({ number: String(nextNumber) });
    setDialogOpen(true);
  };

  const openEditDialog = (weekItem) => {
    setSelectedWeek(weekItem);
    setWeekForm({ number: String(weekItem.number) });
    setDialogOpen(true);
  };

  const handleSaveWeek = async () => {
    if (!monthRecord) return;

    const parsedNumber = Number(weekForm.number);
    if (!Number.isInteger(parsedNumber) || parsedNumber <= 0) {
      setError('La semana debe tener un numero mayor que cero.');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const payload = {
        number: parsedNumber,
        month_id: monthRecord.id,
        subject_id: Number(subjectId),
      };

      if (selectedWeek) {
        await axiosInstance.put(`/weeks/${selectedWeek.id}`, payload);
        setSuccess('Semana actualizada.');
      } else {
        await axiosInstance.post('/weeks/', payload);
        setSuccess('Semana creada.');
      }

      setDialogOpen(false);
      setWeekForm({ number: '' });
      setSelectedWeek(null);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.detail || 'No se pudo guardar la semana.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteWeek = async () => {
    if (!selectedWeek) return;

    setSaving(true);
    setError('');

    try {
      await axiosInstance.delete(`/weeks/${selectedWeek.id}`);
      setDeleteDialogOpen(false);
      setSuccess('Semana eliminada.');
      setSelectedWeek(null);
      fetchData();
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          'No se pudo eliminar la semana. Borra antes el contenido asociado.'
      );
    } finally {
      setSaving(false);
    }
  };

  const goToWeek = (weekItem) => {
    navigate(`/subjects/${subjectId}/month/${month}/week/${weekItem.number}${groupQuery}`);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setContentFilter('all');
  };

  if (loading) {
    return <LoadingSpinner message="Cargando semanas..." />;
  }

  return (
    <Box sx={{ background: '#f5f7fa', minHeight: '100vh' }}>
      <Box
        sx={{
          background: 'linear-gradient(135deg, #ff9800 0%, #ffd200 100%)',
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
              sx={{ color: 'rgba(255,255,255,0.85)', textDecoration: 'none', fontSize: '0.9rem' }}
            >
              <Home sx={{ fontSize: '1rem', mr: 0.5, verticalAlign: 'middle' }} />
              Dashboard
            </Link>
            <Link
              component="button"
              onClick={() => navigate('/grades')}
              sx={{ color: 'rgba(255,255,255,0.85)', textDecoration: 'none', fontSize: '0.9rem' }}
            >
              Grados
            </Link>
            <Link
              component="button"
              onClick={() => navigate(`/subjects/${subjectId}${groupQuery}`)}
              sx={{ color: 'rgba(255,255,255,0.85)', textDecoration: 'none', fontSize: '0.9rem' }}
            >
              {subject?.name || 'Materia'}
            </Link>
            <Typography sx={{ color: '#fff', fontWeight: 700, fontSize: '0.9rem' }}>
              {monthName}
            </Typography>
          </Breadcrumbs>

          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 2,
              flexWrap: 'wrap',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box
                sx={{
                  background: 'rgba(255,255,255,0.25)',
                  borderRadius: '16px',
                  p: 1.5,
                  display: 'flex',
                }}
              >
                <CalendarViewWeek sx={{ color: '#fff', fontSize: '2.5rem' }} />
              </Box>
              <Box>
                <Typography variant="h3" fontWeight={800} sx={{ color: '#fff', lineHeight: 1 }}>
                  {monthName}
                </Typography>
                <Typography sx={{ color: 'rgba(255,255,255,0.92)', mt: 0.5 }}>
                  {subject?.name} - semanas, recursos y evaluaciones del mes
                </Typography>
                {activeGroupLabel && (
                  <Chip
                    label={`Seccion activa: ${activeGroupLabel}`}
                    sx={{
                      mt: 1.5,
                      bgcolor: 'rgba(255,255,255,0.2)',
                      color: '#fff',
                      fontWeight: 700,
                    }}
                  />
                )}
              </Box>
            </Box>

            {canManageWeeks && (
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={openCreateDialog}
                sx={{
                  background: '#1a237e',
                  '&:hover': { background: '#11195b' },
                }}
              >
                Nueva semana
              </Button>
            )}
          </Box>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ py: 5 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}
        {success && (
          <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
            {success}
          </Alert>
        )}

        <Grid container spacing={2} sx={{ mb: 3 }}>
          {[
            {
              label: 'Semanas creadas',
              value: monthSummary.weeks,
              helper: `${monthSummary.withContent} con contenido`,
              icon: <CalendarViewWeek sx={{ color: '#ff9800' }} />,
            },
            {
              label: 'Contenidos publicados',
              value: monthSummary.total,
              helper: `${monthSummary.fichas} fichas y ${monthSummary.videos} videos`,
              icon: <AutoStories sx={{ color: '#1976d2' }} />,
            },
            {
              label: 'Evaluaciones',
              value: monthSummary.evaluaciones,
              helper: 'Tareas y examenes programados',
              icon: <Quiz sx={{ color: '#8e24aa' }} />,
            },
          ].map((item) => (
            <Grid item xs={12} md={4} key={item.label}>
              <Paper
                sx={{
                  p: 2.5,
                  borderRadius: '20px',
                  boxShadow: '0 8px 24px rgba(15, 23, 42, 0.06)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                }}
              >
                <Box
                  sx={{
                    width: 52,
                    height: 52,
                    borderRadius: '16px',
                    background: 'rgba(25, 118, 210, 0.08)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {item.icon}
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    {item.label}
                  </Typography>
                  <Typography variant="h5" fontWeight={800}>
                    {item.value}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {item.helper}
                  </Typography>
                </Box>
              </Paper>
            </Grid>
          ))}
        </Grid>

        <Paper
          sx={{
            p: 2.5,
            mb: 4,
            borderRadius: '20px',
            boxShadow: '0 8px 24px rgba(15, 23, 42, 0.06)',
          }}
        >
          <Grid container spacing={2}>
            <Grid item xs={12} md={5}>
              <TextField
                fullWidth
                label="Buscar semana o contenido"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Estado</InputLabel>
                <Select
                  value={statusFilter}
                  label="Estado"
                  onChange={(event) => setStatusFilter(event.target.value)}
                >
                  {STATUS_FILTER_OPTIONS.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Contenido</InputLabel>
                <Select
                  value={contentFilter}
                  label="Contenido"
                  onChange={(event) => setContentFilter(event.target.value)}
                >
                  {CONTENT_FILTER_OPTIONS.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={1}>
              <Button fullWidth variant="outlined" onClick={clearFilters} sx={{ height: '100%' }}>
                Limpiar
              </Button>
            </Grid>
          </Grid>

          <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5 }}>
            Se muestran {visibleWeeks.length} de {weeks.length} semanas para {monthName}.
          </Typography>
        </Paper>

        <Box sx={{ mb: 3 }}>
          <Typography variant="h5" fontWeight={700} sx={{ mb: 0.5 }}>
            Semanas de {monthName}
          </Typography>
          <Typography color="text.secondary">
            Cada semana puede incluir fichas, videos, materiales, tareas y examenes para los alumnos.
          </Typography>
        </Box>

        <Grid container spacing={3}>
          {visibleWeeks.length === 0 ? (
            <Grid item xs={12}>
              <Paper sx={{ p: 5, textAlign: 'center', borderRadius: '24px' }}>
                <Typography variant="h6" fontWeight={700} sx={{ mb: 1 }}>
                  No hay semanas que coincidan con esos filtros.
                </Typography>
                <Typography color="text.secondary" sx={{ mb: 2 }}>
                  Ajusta los filtros o crea una nueva semana para empezar el contenido del mes.
                </Typography>
                {canManageWeeks && (
                  <Button variant="contained" startIcon={<Add />} onClick={openCreateDialog}>
                    Crear semana
                  </Button>
                )}
              </Paper>
            </Grid>
          ) : (
            visibleWeeks.map((weekItem, index) => {
              const colors = WEEK_COLORS[index % WEEK_COLORS.length];
              return (
                <Grid item xs={12} sm={6} lg={4} key={weekItem.id}>
                  <Card
                    sx={{
                      cursor: 'pointer',
                      height: '100%',
                      borderRadius: '28px',
                      background: colors.bg,
                      color: '#fff',
                      boxShadow: `0 16px 40px ${colors.shadow}`,
                      position: 'relative',
                      overflow: 'hidden',
                      transition: 'transform 0.25s ease, box-shadow 0.25s ease',
                      '&:hover': {
                        transform: 'translateY(-6px)',
                        boxShadow: `0 24px 54px ${colors.shadow}`,
                      },
                    }}
                    onClick={() => goToWeek(weekItem)}
                  >
                    <Box
                      sx={{
                        position: 'absolute',
                        top: -20,
                        right: -20,
                        width: 120,
                        height: 120,
                        borderRadius: '50%',
                        background: 'rgba(255,255,255,0.12)',
                      }}
                    />
                    <CardContent sx={{ position: 'relative', zIndex: 1 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1 }}>
                        <Chip
                          label={`Semana ${weekItem.number}`}
                          sx={{
                            bgcolor: 'rgba(255,255,255,0.22)',
                            color: '#fff',
                            fontWeight: 700,
                          }}
                        />
                        {canManageWeeks && (
                          <Box sx={{ display: 'flex', gap: 0.5 }}>
                            <IconButton
                              size="small"
                              sx={{ color: '#fff', bgcolor: 'rgba(255,255,255,0.16)' }}
                              onClick={(event) => {
                                event.stopPropagation();
                                openEditDialog(weekItem);
                              }}
                            >
                              <Edit fontSize="small" />
                            </IconButton>
                            <IconButton
                              size="small"
                              sx={{ color: '#fff', bgcolor: 'rgba(255,255,255,0.16)' }}
                              onClick={(event) => {
                                event.stopPropagation();
                                setSelectedWeek(weekItem);
                                setDeleteDialogOpen(true);
                              }}
                            >
                              <Delete fontSize="small" />
                            </IconButton>
                          </Box>
                        )}
                      </Box>

                      <Typography variant="h4" fontWeight={900} sx={{ mt: 2, mb: 0.5 }}>
                        Semana {weekItem.number}
                      </Typography>
                      <Typography sx={{ color: 'rgba(255,255,255,0.88)', mb: 2.5 }}>
                        {weekItem.summary.total > 0
                          ? `${weekItem.summary.total} contenidos publicados para los alumnos`
                          : 'Semana creada, aun sin contenido publicado'}
                      </Typography>

                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                        <Chip
                          size="small"
                          icon={<AutoStories sx={{ color: '#fff !important' }} />}
                          label={`${weekItem.summary.fichas} fichas`}
                          sx={{ bgcolor: 'rgba(255,255,255,0.18)', color: '#fff' }}
                        />
                        <Chip
                          size="small"
                          icon={<OndemandVideo sx={{ color: '#fff !important' }} />}
                          label={`${weekItem.summary.videos} videos`}
                          sx={{ bgcolor: 'rgba(255,255,255,0.18)', color: '#fff' }}
                        />
                        <Chip
                          size="small"
                          icon={<Quiz sx={{ color: '#fff !important' }} />}
                          label={`${weekItem.summary.tareas + weekItem.summary.examenes} evaluaciones`}
                          sx={{ bgcolor: 'rgba(255,255,255,0.18)', color: '#fff' }}
                        />
                      </Box>

                      <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.88)' }}>
                        Materiales: {weekItem.summary.materiales} · Tareas: {weekItem.summary.tareas} · Examenes:{' '}
                        {weekItem.summary.examenes}
                      </Typography>
                    </CardContent>

                    <CardActions sx={{ px: 2.5, pb: 2.5, position: 'relative', zIndex: 1 }}>
                      <Button
                        fullWidth
                        variant="contained"
                        onClick={(event) => {
                          event.stopPropagation();
                          goToWeek(weekItem);
                        }}
                        endIcon={<ArrowForward />}
                        sx={{
                          bgcolor: 'rgba(255,255,255,0.24)',
                          color: '#fff',
                          borderRadius: '999px',
                          backdropFilter: 'blur(6px)',
                          '&:hover': { bgcolor: 'rgba(255,255,255,0.32)' },
                        }}
                      >
                        Ver contenidos
                      </Button>
                    </CardActions>
                  </Card>
                </Grid>
              );
            })
          )}
        </Grid>
      </Container>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>{selectedWeek ? 'Editar semana' : 'Nueva semana'}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            type="number"
            margin="dense"
            label="Numero de semana"
            value={weekForm.number}
            onChange={(event) => setWeekForm({ number: event.target.value })}
            inputProps={{ min: 1, step: 1 }}
          />
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
            La semana quedara registrada en {monthName} para {subject?.name}.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleSaveWeek} disabled={saving} startIcon={<Save />}>
            Guardar
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Eliminar semana</DialogTitle>
        <DialogContent>
          <Typography>
            Se eliminara la semana {selectedWeek?.number}. Si tiene contenido, primero debes borrar
            ese contenido.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancelar</Button>
          <Button color="error" variant="contained" onClick={handleDeleteWeek} disabled={saving}>
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>

      <Footer />
    </Box>
  );
};

export default MonthPage;
